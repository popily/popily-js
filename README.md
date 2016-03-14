===
Popily JS
===

A JavaScript wrapper for the [Popily](https://popily.com) API. 

## Quickstart

Add `<script src="popily.min.js"></script>` to your page, then add some data to Popily.

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

Now get back interactive visualizations about the relationships in your data, and drop them into a web page.

```html
<div id="my-chart"></div>
```

```javascript
popily.api.getInsight('age-favorite-color', {}, function(err, chartData) {
    popily.chart.render('#my-chart', chartData);
  }
);
```

From the here the world is your oyster. Connect directly to a database, customize your charts, filter the data displayed in the charts, and update your charts automatically whenever the data changes. Get more details about how to use the API at [developers.popily.com](http://developers.popily.com).