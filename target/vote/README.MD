## Pages

### Active pages
- `page_cast.html`: Cast votes for a selected poll.
- `page_cast_list.html`: List available polls for voting.
- `page_cast_result.html`: Display voting results for a poll.
- `page_poll_edit.html`: Create, edit, and remove polls.
- `page_poll_question_edit.html`: Manage questions and answers for a selected poll.
- `page_user_edit.html`: Create, edit, and remove user profiles.
- `page_code.html`: Manage access codes.

### Work-in-progress / experimental pages
- `page_cast_list2.html`, `page_poll_edit02.html`, `page_poll_question_edit_02.html`, `page_poll_question_edit_03.html`, `page_cast_result_02.html`, `page_cast_result01.html`: Iterative redesigns and experiments. Not production-ready.
- `page_cast_listOld.html`: Deprecated; kept for reference only.


## Data attributes

HTML elements use `data-*` attributes to encode behaviour and state. Prefer these over class-name hacks or hidden inputs.

| Attribute | Purpose |
|---|---|
| `data-action` | Describes the action an element triggers. |
| `data-command` | Marks an element as a command source. |
| `data-disabled` | Element exists in the DOM but should be ignored or blocked by application logic. |
| `data-field` | Binds a query field to an HTML element. |
| `data-field-type` | Defines the expected data type of the field. |
| `data-group` | Links related elements into a logical group. |
| `data-hidden` | Element exists in the DOM but is treated as absent. |
| `data-id` | Stores a unique element identifier. |
| `data-section` | Marks an important page section for lookup and selection. |
| `data-state` | Stores UI state (use consistent state value conventions). |
| `data-target` | Identifies a target element for an operation. |
| `data-validation` | Specifies validation rules, e.g. `required`, `email`, `min`. |
| `data-value` | Stores a value directly on the element. |

The most commonly used attributes are `data-field`, `data-action`, and `data-section`. The others are less frequent but should be applied wherever they fit — they make the intent of HTML structure easier to follow at a glance.

## Search optimize

<title>Sökordsoptimerad Titel – Max 60 Tecken</title>
<meta name="description" content="Här skriver du en lockande sammanfattning av sidans innehåll för att få sökare att klicka.">
<link rel="canonical" href="https://dinwebbplats.se">

för delade länkar
<meta property="og:title" content="Sökbar HTML-sida för Google">
<meta property="og:description" content="En guide till de bästa SEO-taggarna.">
<meta property="og:image" content="https://dinsajt.se">

