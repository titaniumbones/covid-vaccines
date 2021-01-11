let vaccine_target = 'https://api.opencovid.ca/timeseries?loc=ON&stat=avaccine',
    summary_target = 'https://api.opencovid.ca/summary'

// vaccine_target = "./data/ontario-avaccine.json"
// summary_target = "./data/canada-summary.json"
//  const onPop = 14570000;
const popFigures= {
  Canada: 38008005,
  NL: 521000,
  PEI: 159703,
  "Nova Scotia": 979115,
  "New Brunswick": 781315,
  Quebec: 8575779,
  Ontario: 14733119,
  Manitoba: 1379584,
  Saskatchewan: 1177884,
  Alberta:4428112,
  BC:5145851,
  Yukon: 42176,
  NWT: 45074,
  Nunavut: 39285
}
let result;

//fetch (proxy + target)
fetch (vaccine_target)
  .then(response => response.json())
  .then(json => {
    result=json
    const latestDay = result.avaccine.slice(-1)[0].date_vaccine_administered
    let avaccine = result.avaccine.map(item => {
      let d = item.date_vaccine_administered;
      item.date_vaccine_administered = new Date (d.slice(6), Number(d.slice(3,5)) -1, d.slice(0,2));
      return item})
    let cjsData = avaccine.map(item => { return {t: item.date_vaccine_administered, y: item.avaccine, total: item.cumulative_avaccine}})
    let cjsData2 = avaccine.map(item => { return {t: item.date_vaccine_administered, y: item.cumulative_avaccine}})
    // console.log(cjsData);
    const ctx = document.getElementById('chartJS').getContext('2d');
    const latestTotal = avaccine.slice(-1)[0].cumulative_avaccine
    const latestDaily = avaccine.slice(-1)[0].avaccine
    const avgDaily = getAverage(avaccine)
    const per100K = Math.round ((latestTotal / popFigures.Ontario) * 100000)
    //const latestDay = avaccine.slice(-1)[0].date_vaccine_administered
    console.log(per100K);
    let daysToGo = Math.round((popFigures.Ontario - latestTotal )/avgDaily),
        endMom = moment().add(daysToGo, "days"),
        endDate = endMom.format("MMM DD, YYYY"),
        span = document.querySelector("#endDate") 
    span.textContent = endDate
    endMom < moment('2020-09-01') ? span.className = "good" : span.className = "bad"
    
    myBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label:"vaccines",
          data: cjsData,
          yAxisID: 'daily',
          color: 'green',
          backgroundColor: 'rgba(40,200,40,0.2)'
        }, {
          label: "cumulative",
          data: cjsData2,
          type: 'line',
          borderColor: 'red',
          yAxisID: 'total'
        }]
      },
      options: {
        responsive: true,
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `Ontario Vaccine Progress - ${per100K} per 100K`,
          fontSize: 16
        },
        scales: {
          xAxes: [{
            type: 'time',
            distribution: 'linear',
            time: {
              unit: 'day',
              // displayFormats: {
              //   quarter: 'MMM DD'
              // }
            }
          }],
          yAxes: [{
            id: 'daily',
            type: 'linear',
            position: 'left',
          }, {
            id: 'total',
            type: 'linear',
            position: 'right',
          }]
        },
        animation: {
          onComplete: function() {
            document.querySelector('figure#chartfig figcaption').className="show"}
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              var label = data.datasets[tooltipItem.datasetIndex].label || '';

              if (label) {
                label += ': ';
              }
              label += `${tooltipItem.yLabel.toLocaleString(undefined,{minimumFractionDigits:0})} = ${Math.round(100000 * tooltipItem.yLabel/popFigures.Ontario)}/100k`;
              return label;
            }
          }
        }
      }
    });
    
  })


//fetch(`${proxy}https://api.opencovid.ca/summary`)
fetch(summary_target)
  .then(response => response.json())
  .then(json => {
    //console.log(json);
    let vaccineProportionalSeries = [],
        recoveredProportionalSeries = [],
        
        provinceVaccineLabels = [],
        immuneLabels = [],
        agregatePop=popFigures.Canada,
        agregateVaccine = 0,
        agregateRecovered = 0,
        onAdmin,
        onDist
    
    json.summary
      .sort((a,b) =>  getProportion(a) > getProportion(b) ? -1 : 1)
      .map(province => {
        console.log(province);
        if (province.province !== "Repatriated") {
          let totPop = popFigures[province.province]
          console.log(totPop)
          agregateVaccine += province.cumulative_avaccine
          agregateRecovered += province.cumulative_recovered
          provinceVaccineLabels.push(province.province)
          let propVaccine = Math.round((province.cumulative_avaccine / totPop) * 100000)
          vaccineProportionalSeries.push(propVaccine);

          let propRecovered = Math.round((province.cumulative_recovered / totPop) * 100000)
          console.log(propVaccine);
          recoveredProportionalSeries.push(propRecovered)
          if (province.province == "Ontario") {
            onAdmin = province.cumulative_avaccine,
            onDist = province.cumulative_dvaccine
          }
        }
        return province
        //return ({y: province.province, x:propVaccine })
      })
      .sort((a,b) =>  getProportion(a) > getProportion(b) ? -1 : 1)
      .forEach(province => {
        
      })
    console.log(agregateVaccine, agregatePop);
    const goodColor = 'rgba(40,200,40, 0.2)',
          badColor = 'rgba(200,40,40,0.2)'
    agProp = Math.round((agregateVaccine / agregatePop) * 100000)
    agPropRec = Math.round((agregateRecovered / agregatePop) * 100000)
    //agProp = (agregateVaccine / agregatePop) * 100000
    let barColors = vaccineProportionalSeries.map(value => value > agProp ? 'rgba(40,200,40, 0.2)' : 'rgba(200,40,40,0.2)')
    
    vaccineProportionalSeries.push(agProp)
    recoveredProportionalSeries.push(agPropRec)
    provinceVaccineLabels.push('Canada')
    let ctx = document.getElementById('provinceChart').getContext('2d')
    let provinceChart= new Chart(ctx, {
      type: 'horizontalBar',
      data: {
        labels: provinceVaccineLabels,
        datasets: [{
          //label:"vaccines",
          data: vaccineProportionalSeries,
          xAxisID: 'prop',
          color: 'green',
          backgroundColor: barColors
        }]
      },
      options:{
        title: {
          display: true,
          text: `Comparative vaccination/100K in Canada`,
          fontSize: 16
        },
        legend: {
          display: true,
          labels: [ {text: "Worse than Average", fillStyle: badColor },
                    {text: "Better than Average", fillStyle: goodColor}]

        },
        scales: {
          xAxes: [{
            id: 'prop',
            type: 'linear',
            position: 'left',
          }]},
        animation: {
          onComplete: function() {
            document.querySelector('figure#provincesfig figcaption').className="show"}
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              var label = data.datasets[tooltipItem.datasetIndex].label || '';

              if (label) {
                label += ': ';
              }
              label += Math.round(tooltipItem.xLabel) + "/100k";
              return label;
            }
          }
        }
      }
    })
    let vaccinePercent = vaccineProportionalSeries.map(i => i/1000)
    let recoveredPercent = recoveredProportionalSeries.map(i=> i/1000)
    console.log(recoveredProportionalSeries);

    let ctx3 = document.getElementById('stackedChart').getContext('2d')
    let stackedChart = new Chart (ctx3, {
      type: 'horizontalBar',
      data: {
        labels: provinceVaccineLabels,
        datasets: [{
          data: vaccinePercent,
          xAxisID: 'prop',
          color: 'green',
          backgroundColor: goodColor,
          label: "vaccinated"
        }, {
          data: recoveredPercent,
          xAxisID: 'prop',
          backgroundColor: 'rgba(60,60,60,0.2)',
          label: "recovered"
        }]
      },
      options:{
        aspectRatio: 4,
        responsive: true,
        //maintainAspectRatio: false,
        title: {
          display: true,
          text: `Very Rough "Immune" Percentages in Canada`,
          fontSize: 16
        },
        legend: {
          display: true,
          // labels: [ {text: "Worse than Average", fillStyle: badColor },
          //           {text: "Better than Average", fillStyle: goodColor}]

        },
        scales: {
          xAxes: [{
            id: 'prop',
            type: 'linear',
            position: 'left',
            stacked: true,
            ticks: {
              // max: 10,
              callback: function(value, index, values) {
                return value + '%';
              }
            },
          }],
          yAxes: [{stacked:true}]
        },
        animation: {
          onComplete: function() {
            document.querySelector('figure#provincesfig figcaption').className="show"}
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              var label = data.datasets[tooltipItem.datasetIndex].label || '';

              if (label) {
                label += ': ';
              }
              label += Math.round(tooltipItem.xLabel * 100) / 100 + "%";
              return label;
            }
          }
        }
      }
    })
  
    let ctx4 = document.getElementById('pieChart').getContext('2d')
    let distPie = new Chart (ctx4, {
      type: 'pie',
      data: {
        labels: ["administered", "unadministered"],
        datasets: [{ 
          data: [onAdmin, onDist - onAdmin],
          backgroundColor: [goodColor, "grey"]
        }]
      },
      options: {
        tooltips: {
          callbacks: {
            label: function (tooltipItem, data) {
              try {
                let label = ' ' + data.labels[tooltipItem.index] || '';

                if (label) {
                  label += ': ';
                }
                let i = tooltipItem.index,
                    d = data.datasets[0].data[i]
                label += `${d.toLocaleString(undefined,{minimumFractionDigits:0})} = ${Number((d / onDist) * 100).toFixed(2)}%`;
                return label
              } catch (error) {
                console.log(error);
              }
            }
          }
        },
        title: {
          display: true,
          text: [`Percentage Administered in Ontario`, `(Total Distributed to ON by feds: ${onDist.toLocaleString(undefined,{ minimumFractionDigits: 0 })})`],
          fontSize: 16
        },
        animation: {
          onComplete: function() {
            document.querySelector('figure#piefig figcaption').className="show"}
        }
      }
    })
  })


function getProportion(item, combined=false) {
  return combined
    ? ((item.cumulative_avaccine + item.cumulative_recovered)/popFigures[item.province])
    : (item.cumulative_avaccine/popFigures[item.province])
}


function getAverage (list, days=7) {
  let recent = list.slice(0-days),
      total = 0
  recent.forEach (item => total += item.avaccine)
  return total/days
  
}

