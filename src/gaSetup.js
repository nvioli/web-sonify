// these two functions provide the interface between our app and the gaQuery module.

import Tone from 'tone';
import scheduler from "./scheduler.js";
import synth from "./synth.js";
import ui from "./ui/index2.js";
import notes from "./notes.js";

export default {oneTimeCb,liveQueryCb}

// runs once, on inital load
function oneTimeCb(results) {
  const storeGoalList = ui.store.get('goalList') || [];
  let goalList = [];
  if (results && !results.error) {
    results.items.push({id: "(not set)", name: "none"});
    //need this extra step in case a goal has been added in GA that's not in the initialGoalGroups list
    goalList = results.items.map(goal => ({id: goal.id,name: goal.name}));

    //now  merge the two
    for(var i in goalList){
      for (var j in storeGoalList) {
        if (goalList[i].id == storeGoalList[j].id) {
          goalList[i].group = storeGoalList[j].group;
          break;
        }
      }
    }
    //TODO deal better with if the results come back in error. This will reset the list (and probably crash the app) rather than using what's available in defaults.
    ui.store.set({goalList});
  }
}

// runs every minute to update the app with the new data from ga
function liveQueryCb(response) {
  const goalCount = response.result.rows.reduce((result, item, index, array) => {
    result[item[0]] = item[1];
    return result;
  },{});

  const goalList = ui.store.get('goalList');
  goalList.forEach(goal => {
    goal.visitors = goalCount[goal.id] || 0;
    goal.group = goal.group || ui.store.get('initialGoalGroups')[goal.id] || "groupA";
  })
  ui.store.set({goalList});

  const groupVisitorCounts = goalList.reduce((result, item, index, array) => {
    if (item.group in result) {
      result[item.group] += 1 * item.visitors;
    } else {
      result[item.group] = 1 * item.visitors;
    }
    return result;
  },{});

  //reset all the things
  // synth.reset();
  scheduler.schedule(groupVisitorCounts);
  notes.keyChange();
}
