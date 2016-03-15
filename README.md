===
Popily JS
===

A JavaScript wrapper for the [Popily](https://popily.com) API. 

## Quickstart

First add `<meta charset="utf-8">` just after the `<head>` tag, then put `<script src="popily.min.js"></script>` wherever you want. 

```html
<head>
    <meta charset="utf-8">
    <!-- other stuff goes here -->
</head>
<body>
    <!-- lots of stuff here -->
    <script src="popily.min.js"></script>
</body>
```

Now you can add some data to Popily.

```javascript
popily.api.setToken('your-api-token');

// Add a source
columns = [
    {
        'column_header': 'Age',
        'data_type': 'number'
    },
    {
        'column_header': 'Favorite Color',
        'data_type': 'category'
    }
]
popily.addSource('http://ages-and-colors.csv', {columns:columns}, function(err, source) {
    console.log(source); 
});
```

Once data is added, you can get back interactive visualizations about the relationships in your data, and drop them into a web page.

```html
<div id="my-chart"></div>
```

```javascript
// Grab insight with slug age-favorite-color and render in my-chart div
popily.api.getAndRender('#my-chart', {insight: 'age-favorite-color'});
```

From the here the world is your oyster. Connect directly to a database, customize how the insight is displayed (or just use the best-practice visualization we generate out of the box), filter the data displayed in the charts, and update your charts automatically whenever the data changes. Get more details about how to use the API at [developers.popily.com](http://developers.popily.com).
