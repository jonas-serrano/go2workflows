// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// A generic onclick callback function.
chrome.contextMenus.onClicked.addListener(genericOnClick);

function get_global_workflow_url(raw_string, hostname) {
    console.log("[DBG] Workflow type: GLOBAL");

    var my_regex_expression = new RegExp("(uses\s*:)?\s*([\\w-]+)(/([\\w-]+))?/(.+)@(.+)", "g");
    var match_array = my_regex_expression.exec(raw_string);

    if (match_array[4] == undefined) {
        // Action
        owner = match_array[2];
        repo = match_array[5];
        file_path = "action.yml"
        ref = match_array[6];
    }
    else {
        // Workflow
        owner = match_array[2];
        repo = match_array[4];
        file_path = match_array[5];
        ref = match_array[6];
    }

    return hostname + '/' + owner + '/' + repo + '/blob/' + ref + '/' + file_path
}

function get_local_workflow_url(raw_string, hostname, owner, repo, ref) {
    // inputs:     
    //   selected: uses: ./.github/workflows/publish-docs.yml
    //                   --------NEW_FILE_PATH---------------
    //   url: https://github.com/unifyai/workflows/blob/master/.github/workflows/docs.yml
    //        ----HOST----------/-OWNER-/---REPO--/blob/-REF--/---------FILE_PATH--------
    // outputs: 
    //   https://github.com/unifyai/workflows/blob/master/.github/workflows/publish-docs.yml
    //   ------HOST--------/-OWNER-/---REPO--/blob/--REF-/-----------NEW_FILE_PATH----------
    console.log("[DBG] Workflow type: LOCAL");

    let selected_text_regex = new RegExp("(uses *: *)?\./(.+)", "g");
    let selection_match = selected_text_regex.exec(raw_string);
    let file_path = selection_match[2];

    return hostname + '/' + owner + '/' + repo + '/blob/' + ref + '/' + file_path
}

// A generic onclick callback function.
function genericOnClick(info) {
    if (info.menuItemId == 'selection') {
        // inputs: 
        //      GLOBAL workflow:
        //              {owner}/{repo}/.github/workflows/{filename}@{ref} 
        //              -OWNER-/-REPO-/---------FILE_PATH----------@--REF--
        //      lOCAL workflow:
        //              ./.github/workflows/{filename}
        //              ---------FILE_PATH------------
        // output :  
        //      https://github.com/unifyai/workflows/blob/master/.github/workflows/docs.yml
        //      -----HOSTNAME-----/-OWNER-/--REPO---/blob/--REF-/------FILE_PATH-----------
        //
        console.log("[DBG] Selected text: '" + info.selectionText + "'");

        chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
            var url_regex = new RegExp("(http[s]://.+.com)/([\\w-]+)/([\\w-]+)/blob/([\\w\-]+)/(.+)", "g");
            var url_match = url_regex.exec(tabs[0].url);
            //   url: https://github.com/unifyai/workflows/blob/master/.github/workflows/docs.yml
            //        ----HOST----------/-OWNER-/---REPO--/blob/-REF--/---------FILE_PATH--------
            var hostname = url_match[1];
            var owner = url_match[2];
            var repo = url_match[3];
            var ref = url_match[4];

            if (info.selectionText.includes('@')) // This is a global workflow
              new_tab_url = get_global_workflow_url(info.selectionText, hostname);
            else // This is a local workflow
              new_tab_url = get_local_workflow_url(info.selectionText, hostname, owner, repo, ref);

            console.log('[DGB] New tab url:' + new_tab_url);
            chrome.tabs.create({'url': new_tab_url}, function(tab) {});
        });
    }
}

chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        title: "GO-TO WORKFLOW",
        contexts: ["selection"],
        id: "selection"
    });
});
