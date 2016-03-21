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
        
        var assignedAxis = popily.chart.analyze.assignToAxis(apiResponse.columns, filters);

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
        
        var assignedAxis = popily.chart.analyze.assignToAxis(apiResponse.columns, filters);

        expect(assignedAxis.x.data_type).to.be.equal('datetime');
        expect(assignedAxis.z.column_header).to.be.equal('Ballot Name');
    });

    it('should assign category,datetime for distinct datetime', function() {
        var apiResponse = JSON.parse(JSON.stringify(categoryDatetime));

        var filters = [
            {
                column: 'Voting Close Date',
                op: 'distinct'
            }
        ];
        
        var assignedAxis = popily.chart.analyze.assignToAxis(apiResponse.columns, filters);

        expect(assignedAxis.x.data_type).to.be.equal('category');
        expect(assignedAxis.z.column_header).to.be.equal('Voting Close Date');
    });

});