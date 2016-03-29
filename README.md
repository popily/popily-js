===
Popily JS
===

A JavaScript wrapper for the [Popily](https://popily.com) API. 

## Quickstart

First add `<meta charset="utf-8">` and `<link href="popily.min.css" rel="stylesheet" />` just after the `<head>` tag, then put `<script src="popily.min.js"></script>` wherever you want. 

```html
<head>
    <meta charset="utf-8">
    <link href="popily.min.css" rel="stylesheet" />
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
    },
    {
        'column_header': 'Birth Date',
        'data_type': 'datetime'
    },
    {
        'column_header': 'Favorite Hobby',
        'data_type': 'category'
    }
]

var sourceOptions = {columns:columns, url: 'http://ages-and-colors.csv'};
popily.api.addSource(sourceOptions, function(err, source) {
    console.log(source); 
});
```

Once data is added, you can get back interactive visualizations about the relationships in your data, and drop them into a web page.

```html
<div id="my-chart"></div>
```

```javascript
// Grab an insight about the relationship between Age and Favorite Color
var insightOptions = {source: source.slug, columns: ['Age', 'Favorite Color']};
popily.chart.getAndRender('#my-chart', insightOptions);
```

Now you can customize the output by tweaking what data is displayed and how the chart is presented.

```javascript
var chartOptions = {
    // Get an insight about the relationship between Age and Favorite Color
    columns: ['Age', 'Favorite Color'],
    
    // Calculate the average
    calculation: 'average',
    
    // Limit the output to where Favorite Color was Red, Yellow or Blue
    transformations: [
        {
            column: 'Favorite Color',
            op: 'eq',
            values: ['Red', 'Yellow', 'Blue']
        }
    ],
    
    // Charts are responsive by default, but you can specify the height and width
    height: 500,
    width: 1200,

    // Rotate the output, so bar charts go from left to right instead of bottom to top
    rotated: true,

    // Manually set the x and y axes labels
    xLabel: 'The Favorite Colors We Care About',
    yLabel: 'Average Age Based on Favorite Color',

    // For 3-dimensional charts like stacked bar charts, you can choose which 
    // column goes along the x axis and which is used for grouping (the stacks 
    // in the stacked bar)
    xColumn: 'Favorite Color',
    groupByColumn: 'Favorite Hobby',

    // Include the title Popily auto generates. This is usually something 
    // descriptive like Average Age by Favorite Color Grouped by Favorite Hobby
    title: true,

    // Set the x axis values to appear in reverse alphabetical order
    xOrder: 'z-a'
};

popily.chart.getAndRender('#my-chart', chartOptions);
```

From the here the world is your oyster. Connect directly to a database, customize how the insight is displayed (or just use the best-practice visualization we generate out of the box), filter the data displayed in the charts, and update your charts automatically whenever the data changes. Get more details about how to use the API at [developers.popily.com](http://developers.popily.com).
