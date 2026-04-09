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

/* ## Cast vote, page to cast votes on polls, a bit more complex page
@PROJECT [name: cast-vote] [description: Page used for casting votes on polls] [user: per]

@TASK [project: cast-vote] [description: Load Questions for the poll, place them in document] [status: done] [tag: sql, data]

@TASK [project: cast-vote] [description: Load answers for each question, place them in document] [status: done] [tag: sql, data]

@TASK [project: cast-vote] [description: Render poll and answers in page] [status: active] [tag: ui]

@TASK [project: cast-vote] [description: Add functionality to submit vote and save it in database] [status: open] [tag: sql, backend, ui]

@TASK [project: cast-vote] [description: Generate thread key to connect all votes] [status: open] [tag: sql, backend]

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

