const colors = {
    primary: "rgb(48, 188, 237)",
    primaryLight: "rgba(48, 188, 237, 0.5)",
    secondary: "rgb(100, 58, 113)",
    secondaryLight: "rgba(100, 58, 113, 0.5)",
    primaryOrange: "rgb(252, 122, 30)",
    secondaryOrange: "rgba(242, 76, 0, 0.3)",
    primaryGreen: "rgb(77, 170, 87)",
    secondaryGreen: "rgba(140, 215, 144, 1)",
    primaryRed: "rgb(254, 95, 85)"
}

const exclusions = [
    'YEAR',
    'PLAYER',
    'TARGET',
    'PREDICTION',
    'E',
    'quantile_rank',
    'decile_rank',
    'X.1',
    'X',
    'intercept'
]

const listofQuantiles = d3.range(1, 5)

let listofYears = (_data) => _.sortBy(d3.map(_data, (d) => d.YEAR).values().map((d) => d.YEAR))
let listofFeatures = (_data) => _data.columns.filter((f) => f != '')
    .filter((f) => exclusions.indexOf(f) == -1)

let listofPlayers = (_data) => _.uniq(_data.map((d) => [d.PLAYER, d.YEAR]))

const scatterFeatureImpact = (_data, feature) => {
    let trace = [{
        x: _data.map((d) => d.PREDICTION),
        y: _data.map((d) => d[feature]),
        mode: 'markers',
        marker: {
            size: d3.range(1, 20),
            color: colors.primaryGreen
        }
    }]
    Plotly.newPlot('scatter-bubbles', trace, layout = {
        title: `Feature Relationships (${feature.toLocaleLowerCase()})`,
        height: 300,
        xaxis: {
            title: "Salary"
        },
        yaxis: {
            title: `${feature.toLocaleLowerCase()}`
        }
    })
}

const distResid = (_data) => {
    let trace = [{
        histfunc: "count",
        x: _data.map((d) => d.E),
        type: 'histogram',
        marker: {
            color: colors.primaryRed
        }
    }]
    Plotly.newPlot('dist-resid', trace, layout = {
        height: 300,
        barmode: 'stack',
        title: `Distribution of Residuals`,
        xaxis: {
            title: "Residuals"
        },
        yaxis: {
            title: "Count"
        }
    });
}

const histPlot = (_data) => {
    let trace = [{
        histfunc: "count",
        x: _data.map((d) => d.TARGET),
        type: 'histogram',
        name: 'Actuals',
        marker: {
            color: colors.primary,
        }
    }, {
        histfunc: "count",
        x: _data.map((d) => d.PREDICTION),
        type: 'histogram',
        name: 'Prediction',
        marker: {
            color: colors.secondary,
        }
    }]
    Plotly.newPlot('hist-target', trace, layout = {
        height: 300,
        barmode: 'stack',
        title: `Distribution of Salary`,
        xaxis: {
            title: "Salary"
        },
        yaxis: {
            title: "Count"
        }
    });
}

const metricsCard = (errorMetricsAll, metric) => {
    let data = [{
        type: "indicator",
        mode: "number",
        gauge: {
            shape: "bullet"
        },
        delta: {
            reference: 300
        },
        value: errorMetricsAll[metric],
        domain: {
            x: [0, 1],
            y: [0, 1]
        },
        title: {
            text: metric == 'r^2' ? 'R<sup>2</sup>' : `${metric.toUpperCase()}`
        }
    }, ]
    Plotly.newPlot('metrics', data, layout = {
        title: 'Regression Metrics',
        height: 250
    });
}

const sqErr = (_data) => _data.map((d) => d.E).map((e) => e ** 2)

// MSE = (1/n) * Σ(yi - yhat)²
const rmse = (_data) => {
    let n = _data.length
    let se = sqErr(_data)
    let mse = (1 / n) * d3.sum(se)
    return Math.sqrt(mse)
}

// Mean Absolute Error = (1/n) * Σ |yᵢ - ŷᵢ| 
const mae = (_data) => (1 / _data.length) * d3.sum(_data.map((d) => Math.abs(d.TARGET - d.PREDICTION)))

// Mean Absolute Percentage Error = (100/n) ∑(|Actual - Predicted|/Actual)
const mape = (_data) => (100 / _data.length) * d3.sum(_data.map((d) => Math.abs(d.TARGET - d.PREDICTION) / d.TARGET))

// R-squared = 1 - (Sum of Squared Errors (SSE) / Total Sum of Squares (TSS))
const r2 = (_data) => 1 - d3.sum(sqErr(_data)) / d3.sum(
    _data.map((d) => d.TARGET - d3.mean(_data.map((d) => d.TARGET))).map((delta) => delta ** 2)
)

const boxPlot = (_data) => {
    let trace = [{
        y: _data.map((d) => d.TARGET),
        type: 'box',
        name: 'Actual',
        marker: {
            color: colors.primary,
        }
    }, {
        y: _data.map((d) => d.PREDICTION),
        type: 'box',
        name: 'Prediction',
        marker: {
            color: colors.secondary,
        }
    }]
    Plotly.newPlot('box-target', trace, layout = {
        title: 'Distribution of Salary',
        height: 300,
        yaxis: {
            title: 'Salary'
        }
    })
}

const segPlot = (_data, xopt = listofQuantiles[0], year = 2014) => {
    year = parseInt(year)

    let filtered = _data.filter((d) => d.YEAR == year && d.decile_rank == xopt)
    let sorted = filtered.sort(
        (p1, p2) => p1.TARGET - p2.TARGET);

    let x = filtered.map((d) => d.PLAYER)
    let y = filtered.map((d) => d.TARGET)
    let y2 = filtered.map((d) => d.PREDICTION)

    let data = [{
        x: x,
        y: y,
        mode: 'lines+markers',
        name: 'Actuals',
        marker: {
            color: colors.primary,
        }
    }, {
        x: x,
        y: y2,
        mode: 'lines+markers',
        name: 'Prediction',
        marker: {
            color: colors.secondary,
        }
    }];
    Plotly.newPlot('quartile-perf', data, layout = {
        barmode: 'group',
        height: 300,
        title: `Annual Performance by Quartile (${year})`,
        xaxis: {
            tickangle: -25,
        },
        yaxis: {
            title: 'Salary'
        },
    });
}

const groupBy = function(xs, key) {
    // credit: https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-an-array-of-objects
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

const YoYError = (_data, metric = 'rmse') => {
    let years = groupBy(_data, 'YEAR')
    let data = [{
        x: listofYears(_data),
        y: Object.values(years).map((y) => rmse(y)),
        type: 'scatter',
        name: 'RMSE',
        marker: {
            color: colors.secondaryOrange,
        },
    }, {
        x: listofYears(_data),
        y: Object.values(years).map((y) => mae(y)),
        type: 'scatter',
        name: 'MAE',
        marker: {
            color: colors.primaryOrange,
        }
    }];
    Plotly.newPlot('yoy-error', data, layout = {
        title: `Error Metrics Year-over-Year in $`,
        height: 250,
        yaxis: {
            title: 'Salary'
        },
        xaxis: {
            title: 'Year'
        }
    });
}

const quartileHistogram = (_data) => {
    let data = [{
        x: _data.map((d) => d.TARGET),
        type: 'histogram',
        name: 'Actuals',
        nbinsx: 4,
        marker: {
            color: colors.primary,
        }
    }, {
        x: _data.map((d) => d.PREDICTION),
        name: 'Prediction',
        type: 'histogram',
        nbinsx: 4,
        marker: {
            color: colors.secondary,
        }
    }];

    Plotly.newPlot('quartile-hist', data, {
        title: "Quartile Distribution",
        height: 320
    });
}

const playerBreakdown = (_data, pick) => {
    let _player = pick.split(',')
    let name = _player[0]
    let year = _player[1]
    let player = _data.filter((d) => d.PLAYER == name && d.YEAR == year)

    let data = player.map((p) => {
        fp = _.pickBy(p, (v, k) => exclusions.indexOf(k) == -1)
        return {
            type: 'bar',
            y: Object.keys(fp),
            x: Object.values(fp),
            orientation: 'h',
            marker: {
                color: colors.primaryGreen,
            }
        }
    });
    Plotly.newPlot('player-breakdown', data, layout = {
        barmode: 'group',
        title: `Feature Impact per Player - ${name}, ${year}`,
        //height: 380,
        yaxis: {
            tickangle: -38
        },
        xaxis: {
            title: 'Change in Salary'
        }
    });

    let salaryData = [{
        type: "indicator",
        mode: "number+delta",
        value: player.map((p) => p.PREDICTION)[0],
        marker: {
            color: colors.secondary,
        },
        number: {
            prefix: "$"
        },
        delta: {
            position: "top",
            reference: player.map((p) => p.TARGET)[0]
        },
        domain: {
            x: [0, 1],
            y: [0, 1]
        },
        title: {
            text: `Y&#770; for ${name}`
        },
    }];

    Plotly.newPlot('player-salary', salaryData, layout = {
        height: 300
    });
}

const pdpPlot = (_data) => {
    // Partial Dependence Plot (PDP) = (total effect of a single predictor) / (number of observations)
    // TODO    
}

const featureImportance = (_data) => {
    let features = listofFeatures(_data)
    let importance = features.map((col) => {
        return {
            [col]: d3.sum(_data.map((d) => d[col]))
        }
    })
    let ranked = _.sortBy(importance, (k) => Math.abs(Object.values(k)[0]))
    let data = [{
        x: ranked.map((r) => Math.abs(Object.values(r)[0])),
        y: ranked.map((r) => Object.keys(r)[0]),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: colors.secondaryGreen,
        }
    }];
    Plotly.newPlot('importance-rankings', data, layout = {
        title: `Feature Importance Ranking`,
        //height: 400,
        xaxis: {
            title: 'Absolute Impact in $'
        }
    });
}

const dataSummary = (_data) => {
    let features = listofFeatures(_data)
    let arr = features.map((col) => {
        return [
            d3.mean(_data.map((d) => parseFloat(d[col]))).toFixed(2),
            d3.deviation(_data.map((d) => parseFloat(d[col]))).toFixed(2),
            d3.min(_data.map((d) => parseFloat(d[col]))).toFixed(2),
            d3.max(_data.map((d) => parseFloat(d[col]))).toFixed(2)
        ]
    })
    let values = arr[0].map((_, colIndex) => arr.map(row => row[colIndex]));
    values.splice(0, 0, features.map((f) => `<b>${f}</b>`))

    let data = [{
        type: 'table',
        header: {
            values: [
                ["<b>Feature Impact</b>"],
                ["<b>Mean</b>"],
                ["<b>SD</b>"],
                ["<b>Min</b>"],
                ["<b>Max</b>"]
            ],
            align: "center",
            line: {
                width: 1,
                color: 'black'
            },
            fill: {
                color: "grey"
            },
            font: {
                family: "Arial",
                size: 12,
                color: "white"
            }
        },
        cells: {
            values: values,
            align: "right",
            line: {
                color: "black",
                width: 1
            },
            font: {
                family: "Arial",
                size: 11,
                color: ["black"]
            }
        }
    }]

    Plotly.newPlot('data-summary', data, layout = {
        title: 'Feature Impact Summary',
        height: 'auto'
    });

}

const stats_js = (_data) => {
    let vars = {
        y_true: 'interval',
        y_pred: 'interval'
    }
    let stats = new Statistics(_data.map((d) => {
            return {
                y_true: parseFloat(d.TARGET),
                y_pred: parseFloat(d.PREDICTION)
            }
        }),
        vars);
    return stats
}

const pearson = (_data) => stats_js(_data).correlationCoefficient('y_true', 'y_pred').correlationCoefficient;

const resid_mean = (_data) => d3.mean(_data.map((d) => d.E))

const regressionMetrics = (_data) => {
    let prsn = pearson(_data)
    let res_mu = resid_mean(_data)

    let values = [
        mae(_data), rmse(_data), r2(_data), prsn, res_mu
    ].map((m) => m > 1 ? m.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
    }) : m.toFixed(3))

    let data = [{
        type: 'table',
        header: {
            values: [
                ["<b>MAE</b>"],
                ["<b>RMSE</b>"],
                ["<b>R^2</b>"],
                ["<b>Pearson</b>"],
                ["<b>Residual Mean</b>"]
            ],
            align: "center",
            line: {
                width: 1,
                color: 'black'
            },
            fill: {
                color: "grey"
            },
            font: {
                family: "Arial",
                size: 12,
                color: "white"
            }
        },
        cells: {
            values: values,
            align: "center",
            line: {
                color: "black",
                width: 1
            },
            font: {
                family: "Arial",
                size: 16,
                color: ["black"]
            }
        }
    }]
    Plotly.newPlot('regression-metrics', data, layout = {
        title: 'Regression Metrics Summary',
        height: 260
    });
}

const decilePerformance = (_data) => {
    deciles = groupBy(_data, 'decile_rank')
    let data = [{
        type: 'scatter',
        x: d3.range(1, 11),
        y: Object.values(deciles).map((d) => d3.mean(d.map((i) => i.PREDICTION))),
        name: 'Predictions',
        marker: {
            color: colors.secondary,
        }
    }, {
        type: 'scatter',
        x: d3.range(1, 11),
        y: Object.values(deciles).map((d) => d3.mean(d.map((i) => i.TARGET))),
        name: 'Actuals',
        marker: {
            color: colors.primary,
        }
    }]
    Plotly.newPlot('decile-perf', data, layout = {
        height: 350,
        title: 'Performance by Decile',
        yaxis: {
            title: 'Salary'
        },
        xaxis: {
            title: 'Decile'
        }
    })
}

const assignOptions = (textArray, selector) => {
    for (let i = 0; i < textArray.length; i++) {
        let currentOption = document.createElement('option');
        currentOption.text = textArray[i];
        selector.appendChild(currentOption);
    }
}

d3.csv(`data/nba_salary_pred_xgb_explainer.csv`, (_data) => {

    let selectContainer = document.querySelector('[data-num="0"'),
        featureSelector = selectContainer.querySelector('.feature-filter');

    // let selectContainer2 = document.querySelector('[data-num="1"'),
    //     metricSelector = selectContainer2.querySelector('.metric-filter');

    let selectContainer3 = document.querySelector('[data-num="2"'),
        segmentSelector = selectContainer3.querySelector('.seg-filter'),
        yearSelector = selectContainer3.querySelector('.year-filter');

    let selectContainer4 = document.querySelector('[data-num="3"'),
        playerSelector = selectContainer4.querySelector('.player-filter');

    assignOptions(listofQuantiles, segmentSelector);
    assignOptions(listofYears(_data), yearSelector);
    assignOptions(listofFeatures(_data), featureSelector)

    // assignOptions(Object.keys(errorMetricsAll), metricSelector)
    assignOptions(listofPlayers(_data), playerSelector)

    const updateSegment = () => segPlot(_data, segmentSelector.value, yearSelector.value)
    const updateHist = () => histPlot(_data, yearSelector.value)
    const updateFeature = () => scatterFeatureImpact(_data, featureSelector.value)
    // const updateMetric = () => metricsCard(errorMetricsAll, metricSelector.value)
    const updatePlayerBreakdown = () => playerBreakdown(_data, playerSelector.value)

    histPlot(_data)
    distResid(_data)
    segPlot(_data, segmentSelector.value, yearSelector.value)
    scatterFeatureImpact(_data, featureSelector.value)
    boxPlot(_data)
    // metricsCard(errorMetricsAll, metricSelector.value)
    YoYError(_data)
    playerBreakdown(_data, playerSelector.value)
    dataSummary(_data)
    featureImportance(_data)
    decilePerformance(_data)
    regressionMetrics(_data)
    quartileHistogram(_data)

    segmentSelector.addEventListener('change', updateSegment, false);
    yearSelector.addEventListener('change', updateSegment, false);
    yearSelector.addEventListener('change', updateHist, false);
    featureSelector.addEventListener('change', updateFeature, false);
    // metricSelector.addEventListener('change', updateMetric, false);
    playerSelector.addEventListener('change', updatePlayerBreakdown, false);
})