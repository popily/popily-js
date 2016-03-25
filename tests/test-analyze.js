var expect = chai.expect;
var should = chai.should();

describe('Testing axis assignment', function() {
    
    it('should assign category,datetime', function() {
        var apiResponse = JSON.parse(JSON.stringify(categoryDatetime));
        
        var assignedAxis = popily.chart.analyze.assignToAxis(apiResponse.columns);

        expect(assignedAxis.x.data_type).to.be.equal('datetime');
        expect(assignedAxis.z.data_type).to.be.equal('category');
      
    });

    it('should assign category,datetime for single datetime', function() {
        var apiResponse = JSON.parse(JSON.stringify(categoryDatetime));

        var filters = [
            {
                column: 'Voting Close Date',
                values: ['2015-06-30']
            }
        ];
        
        var assignedAxis = popily.chart.analyze.assignToAxis(apiResponse.columns, {filters:filters});

        expect(assignedAxis.x.data_type).to.be.equal('category');
        expect(assignedAxis.z.column_header).to.be.equal('Voting Close Date');
    });

    it('should assign category,datetime for single category', function() {
        var apiResponse = JSON.parse(JSON.stringify(categoryDatetime));

        var filters = [
            {
                column: 'Ballot Name',
                values: ['whatever']
            }
        ];
        
        var assignedAxis = popily.chart.analyze.assignToAxis(apiResponse.columns, {filters:filters});

        expect(assignedAxis.x.data_type).to.be.equal('datetime');
        expect(assignedAxis.z.column_header).to.be.equal('Ballot Name');
    });
    

    it('should assign category,datetime for countUnique datetime', function() {
        var apiResponse = JSON.parse(JSON.stringify(categoryDatetime));

        var filters = [
            {
                column: 'Voting Close Date',
                op: 'countUnique'
            }
        ];
        
        var assignedAxis = popily.chart.analyze.assignToAxis(apiResponse.columns, {filters:filters});

        expect(assignedAxis.x.data_type).to.be.equal('datetime');
    });
    
    it('should assign accept user assigning axes', function() {
        var apiResponse = JSON.parse(JSON.stringify(categoryCategoryCategory));

        var multiStackedOptions = {
            xColumn: 'Ballot Name',
            groupByColumn: 'Group Name'
        };
        
        var assignedAxis = popily.chart.analyze.assignToAxis(apiResponse.columns, multiStackedOptions);

        expect(assignedAxis.x.column_header).to.be.equal('Ballot Name');
        expect(assignedAxis.z.column_header).to.be.equal('Group Name');
        expect(assignedAxis.z2.column_header).to.be.equal('Casted Vote');
    });
    
    it('should correctly assign histograms', function() {
        var apiResponse = JSON.parse(JSON.stringify(countByValue));
        
        var assignedAxis = popily.chart.analyze.assignToAxis(apiResponse.columns);
        expect(assignedAxis.x.column_header).to.be.equal('number_3');
        expect(assignedAxis.y.column_header).to.be.equal('count_0');
    });

});


describe('Testing determine types', function() {
    it('should assign count_by_category_by_datetime', function() {
        var apiResponse = JSON.parse(JSON.stringify(categoryDatetime));
        
        var ds = popily.dataset(apiResponse.columns);
        var calculation = apiResponse.calculation;
        var axisAssignments = popily.chart.analyze.assignToAxis(ds.getColumns());
        var analysisType = popily.chart.analyze.determineType(ds.getColumns(), axisAssignments, calculation);

        expect(analysisType).to.be.equal('count_by_category_by_datetime');
      
    });

    it('should assign count_by_category', function() {
        var apiResponse = JSON.parse(JSON.stringify(categoryCategoryDatetime));
        
        var ds = popily.dataset(apiResponse.columns);
        var calculation = apiResponse.calculation;
        popily.chart.applyTransformations(ds, [{'op': 'countUnique', 'column': 'Group Name'}]);
        var axisAssignments = popily.chart.analyze.assignToAxis(ds.getColumns());
        var analysisType = popily.chart.analyze.determineType(ds.getColumns(), axisAssignments, calculation);

        expect(analysisType).to.be.equal('count_by_category');
      
    });

    it('should assign geo_points', function() {
        var apiResponse = JSON.parse(JSON.stringify(coordinates));
        
        var ds = popily.dataset(apiResponse.columns);
        var calculation = apiResponse.calculation;
        var axisAssignments = popily.chart.analyze.assignToAxis(ds.getColumns());
        var analysisType = popily.chart.analyze.determineType(ds.getColumns(), axisAssignments, calculation);

        expect(analysisType).to.be.equal('geo_points');
      
    });

    it('should assign geo_points_category', function() {
        var apiResponse = JSON.parse(JSON.stringify(coordinatesCategory));
        
        var ds = popily.dataset(apiResponse.columns);
        var calculation = apiResponse.calculation;
        var axisAssignments = popily.chart.analyze.assignToAxis(ds.getColumns());
        var analysisType = popily.chart.analyze.determineType(ds.getColumns(), axisAssignments, calculation);

        expect(analysisType).to.be.equal('geo_points_category');
      
    });

    it('should assign count_by_category for count_by_value', function() {
        var apiResponse = JSON.parse(JSON.stringify(countByValue));
        
        var ds = popily.dataset(apiResponse.columns);
        var calculation = apiResponse.calculation;
        var axisAssignments = popily.chart.analyze.assignToAxis(ds.getColumns());
        var analysisType = popily.chart.analyze.determineType(ds.getColumns(), axisAssignments, calculation);

        expect(analysisType).to.be.equal('count_by_category');
      
    });

    it('should assign sum_by_state', function() {
        var apiResponse = JSON.parse(JSON.stringify(sumByCategory));
        
        var ds = popily.dataset(apiResponse.columns);
        var calculation = apiResponse.calculation;
        var axisAssignments = popily.chart.analyze.assignToAxis(ds.getColumns());

        var analysisType = popily.chart.analyze.determineType(ds.getColumns(), axisAssignments, calculation);

        expect(analysisType).to.be.equal('sum_by_state');
      
    });

    it('should assign count_by_state', function() {
        var apiResponse = JSON.parse(JSON.stringify(averageByState));
        
        var ds = popily.dataset(apiResponse.columns);
        var calculation = apiResponse.calculation;
        var axisAssignments = popily.chart.analyze.assignToAxis(ds.getColumns());

        var analysisType = popily.chart.analyze.determineType(ds.getColumns(), axisAssignments, calculation);

        expect(analysisType).to.be.equal('count_by_state');
      
    });

    it('should assign scatterplot', function() {
        var apiResponse = JSON.parse(JSON.stringify(scatterplot));
        
        var ds = popily.dataset(apiResponse.columns);
        var calculation = apiResponse.calculation;
        var axisAssignments = popily.chart.analyze.assignToAxis(ds.getColumns());

        var analysisType = popily.chart.analyze.determineType(ds.getColumns(), axisAssignments, calculation);

        expect(analysisType).to.be.equal('scatterplot');
      
    });

});
