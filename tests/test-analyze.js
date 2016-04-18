var expect = chai.expect;
var should = chai.should();

describe('Testing chart types', function() {
    it('should assign scatterplot', function() {
        var columns = [
            {
                data_type: 'numeric',
                values: [1,2,3,4,5]
            },
            {
                data_type: 'numeric',
                values: [1,2,3,4,5]
            }
        ]

        var chartType = popily.chart.analyze.chartTypeForData(columns,'comparison');
        expect(chartType).to.be.equal('scatterplot');
    });
    it('should assign bar', function() {
        var columns = [
            {
                data_type: 'numeric',
                values: [1]
            },
            {
                data_type: 'numeric',
                values: [1]
            }
        ]

        var chartType = popily.chart.analyze.chartTypeForData(columns,'average');
        expect(chartType).to.be.equal('bar');
    });
    it('should assign barGrouped', function() {
        var columns = [
            {
                data_type: 'numeric',
                values: [1]
            },
            {
                data_type: 'numeric',
                values: [1]
            },
            {
                data_type: 'numeric',
                values: [1]
            },
            {
                data_type: 'category',
                values: [1]
            }
        ]

        var chartType = popily.chart.analyze.chartTypeForData(columns,'average');
        expect(chartType).to.be.equal('barGrouped');
    });
    it('should assign table', function() {
        var columns = [
            {
                data_type: 'numeric',
                values: [1]
            },
            {
                data_type: 'numeric',
                values: [1]
            },
            {
                data_type: 'numeric',
                values: [1]
            },
            {
                data_type: 'category',
                values: [1]
            },
            {
                data_type: 'category',
                values: [1]
            }
        ]

        var chartType = popily.chart.analyze.chartTypeForData(columns,'average');
        expect(chartType).to.be.equal('table');
    });

});
