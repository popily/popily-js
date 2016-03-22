var expect = chai.expect;
var should = chai.should();

var windowDataset;

describe('Testing dataset filtering', function() {
    it('should assign columns', function() {
        var apiResponse = JSON.parse(JSON.stringify(categoryDatetime));
        var dataset = popily.dataset(apiResponse.columns);
        expect(dataset.getColumns().length).to.be.equal(3);
    });

    it('should filter category values', function() {
        var apiResponse = JSON.parse(JSON.stringify(categoryDatetime));
        var dataset = popily.dataset(apiResponse.columns);

        var xColumnHeader = 'Ballot Name';
        var xColumn = _(apiResponse.columns).find(function(x) { return x.column_header == xColumnHeader});
        var yColumn = _(apiResponse.columns).find(function(x) { return x.column_header == 'count'});
        var filterValues = [xColumn.values[0], xColumn.values[1]];
        
        dataset.filter(xColumnHeader, filterValues);

        var filteredColumns = dataset.getColumns();
        var filteredXColumn = _(filteredColumns).find(function(x) { return x.column_header == xColumnHeader});
        var filteredYColumn = _(filteredColumns).find(function(x) { return x.column_header == 'count'});

        expect(filteredColumns.length).to.be.equal(3);
        expect(filteredXColumn.values.length).to.be.lessThan(xColumn.values.length);
        expect(_.every(filteredXColumn.values, function(x) { return _(filterValues).contains(x) }));
        expect(yColumn.values[0]).to.be.equal(filteredYColumn.values[0]);
        expect(yColumn.values[1]).to.be.equal(filteredYColumn.values[1]);
    });

    it('should find distinct', function() {
        var apiResponse = JSON.parse(JSON.stringify(categoryCategoryDatetime));
        var dataset = popily.dataset(apiResponse.columns);
        //dataset.distinct('Ballot Name');
        //dataset.distinct('Voting Close Date');
        //dataset.distinctTogether(['Ballot Name', 'Voting Close Date', 'Group Name']);
        //dataset.distinct('Group Name');
        //window.testData = dataset;
        //console.log(dataset.getColumns());
        /*
        console.log(_.countBy(dataset.getColumns()[2].values, function(col) {
            return col;
        }));
        */
        
    });

});