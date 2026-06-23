// ## TASKS.JS Manage projects and tasks. Main file to track and manage projects 
//    and tasks.
// status: open, active, done, blocked, closed
// type: bug, feature, documentation, refactor
// priority: low, medium, high, critical

/* ## Edit poll, page to edit main poll information
@PROJECT [name: edit-poll] [description: Edit poll and connected tables] [user: per]

@TASK [project: edit-poll] [description: Get main poll information for context when adding poll information] [status: done] 

@TASK [project: edit-poll] [description: Jump to edit poll page or cast vote page] [status: done]
*/

/* ## Duplicate vote, logic to prevent duplicate votes -----------------------
@PROJECT [name: stop-duplicate-vote] [description: Logic to prevent duplicate votes] [user: per]

@TASK [project: stop-duplicate-vote] [description: Save vote information in local storage to prevent duplicate votes] [status: open]

@TASK [project: stop-duplicate-vote] [description: Keep the number of votes stored to 10, no need to store more] [status: open]

*/

/* ## Hashtags, logic to manage hashtags -------------------------------------
@PROJECT [name: hashtags] [description: Logic to manage hashtags] [user: per]

@TASK [project: hashtags] [summary: turn off or on selected hashtags] [status: open]
[description: Add logic to turn off or on selected hashtags, so that the user can filter questions based on hashtags.]
[idea: If user press on then toggle the hashtag, then the hashtag will be added to the list of selected hashtags. If user press off then toggle the hashtag, then the hashtag will be removed from the list of selected hashtags.]

@TASK [project: hashtags] [summary: only update hashtags in page to edit poll] [status: open]
[description: Add logic to turn off or on selected hashtags, so that the user can filter questions based on hashtags.]
[sample: add button close to hashtags to quickly update the selected hashtags.]
*/


/*
## Cleaner: How manage projects and tasks

Find projects
- Find projects: cleaner find "**" --segment comment --pattern "@PROJEC T"
"segment" sets what code segments cleaner will look at

Find tasks
- Find tasks: cleaner find "**" --segment comment --pattern "@TASK"
- Find tasks for project: cleaner find "**" --segment comment --pattern "@TASK" --keys "project" --kv-where "project = 'cast-vote'"

Filter tasks by status (use --kv-where to filter on key value pairs in the comment)
- Find completed tasks: cleaner find "**" --segment comment --pattern "@TASK" --keys "status" --kv-where "status = 'completed'"
  `keys` is used to specify what cleaner will try to extract from the comment, and `kv-where` is used to filter

Add description
- Add description to task: cleaner find "**" --segment comment --pattern "@TASK" --keys "status;description"  --kv-where "status = 'completed'"

Add description and tags
- Add description and tags to task: cleaner find "**" --segment comment --pattern "@TASK" --keys "status;description;tags"

- Advanced: use formating to create a report:
cleaner find "**" --pattern "@TASK" --segment comment --header "project;name;title" --brief "summary;brief" --keys "tag;description;idea;sample" --footer "status;user;assignee" --width 120 --kv-where "str::has_tag(tag, 'sql')"
cleaner find "**" --pattern "@TASK" --segment comment --header "project;name;title" --brief "summary;brief" --keys "tag;description;idea;sample" --footer "status;user;assignee" --width 120 --prompt kv-where


*/

