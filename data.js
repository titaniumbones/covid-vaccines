const proxy = 'https://cors-anywhere.herokuapp.com/',
      target = 'https://api.opencovid.ca/timeseries?loc=ON&stat=avaccine'
const onPop = 14570000;
let result;

fetch (proxy + target)
  .then(response => response.json())
  .then(json => {
    result=json
    let avaccine = result.avaccine.map(item => {
      let d = item.date_vaccine_administered;
      item.date_vaccine_administered = new Date (d.slice(6), Number(d.slice(3,5)) -1, d.slice(0,2));
      return item})
    let cjsData = avaccine.map(item => { return {t: item.date_vaccine_administered, y: item.avaccine, total: item.cumulative_avaccine}})
    let cjsData2 = avaccine.map(item => { return {t: item.date_vaccine_administered, y: item.cumulative_avaccine}})
    console.log(cjsData);
    const ctx = document.getElementById('chartJS').getContext('2d');
    const per100K = Math.round ((avaccine.slice(-1)[0].cumulative_avaccine / onPop) * 100000)
    console.log(per100K);
    myBarChart = new Chart(ctx, {
      type: 'bar',
      data: cjsData,
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
          text: `Ontario Vaccine Progress - ${per100K} per 100K`
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
        }
      }
    });

  })





