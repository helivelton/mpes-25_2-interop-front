import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update } from "firebase/database";
import { JsonPipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, JsonPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  title = 'mpes-interop-front';
  firebaseData: any = null;
  databaseRef: any;
  currentPeopleCount: number = 0;
  doorStateOpen: boolean = false;
  currentLightColor: string = 'rgba(0, 0, 0, 1)';

  @ViewChild('luminosityChart') luminosityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ioChart') ioChartRef!: ElementRef<HTMLCanvasElement>;
  
  private luminosityChart: Chart | null = null;
  private ioChart: Chart | null = null;

  private carlosFirebaseConfig = {
    apiKey: "AcvPwRJ76bEPaNtLaTbGCat0Br9LKaswPIoDNAkJ",
    databaseURL: "https://mpes-2025-2-interop-1-default-rtdb.firebaseio.com",
  };

  constructor() {
    const firebaseConfig = {
      apiKey: "JdKHO4JfG8bper94EOrDkvY4KiIhW1mfQRA37mEa",
      authDomain: "meps-interop-2025-2.firebaseapp.com",
      databaseURL: "https://meps-interop-2025-2-default-rtdb.firebaseio.com",
      projectId: "meps-interop-2025-2",
      storageBucket: "meps-interop-2025-2.appspot.com",
      messagingSenderId: "832145432295",
      appId: "1:832145432295:web:9835198862019888",
    };

    this.loadDatabase();
  }

  loadDatabase() {
    const app = initializeApp(this.carlosFirebaseConfig);
    const db = getDatabase(app);
    this.databaseRef = ref(db, '/');
    onValue(this.databaseRef, (snapshot) => {

      // data example:
      // {
      //   "sensor": {
      //     "luminosity": {
      //       "red": 0,
      //       "green": 0,
      //       "blue": 0,
      //       "clear": 0
      //     },
      //     "entrada": 0,
      //     "saida": 0
      //   }
      // }
      const data = snapshot.val();
      console.log(data);
      this.doorStateOpen = data.atuador.estado;
      this.firebaseData = data;
      this.currentPeopleCount = this.normalizePeopleCount(data.sensor.entrada - data.sensor.saida);
      this.currentLightColor = this.getLightColor(data.sensor.luminosity);
      this.updateCharts();
    });
  }

  normalizePeopleCount(peopleCount: number) {
    return peopleCount > 0 ? peopleCount : 0;
  }

  getLightColor(luminosity: any): string {
    if (!luminosity) {
      return 'rgba(255, 255, 255, 1)';
    }

    const red = luminosity.red || 0;
    const green = luminosity.green || 0;
    const blue = luminosity.blue || 0;

    return `rgba(${red}, ${green}, ${blue}, 1)`;
  }

  ngAfterViewInit() {
    this.initCharts();
    if (this.firebaseData) {
      this.updateCharts();
    }
  }

  updateAtuador() {
    const newState = !this.doorStateOpen;
    console.log(newState);
    const app = initializeApp(this.carlosFirebaseConfig);
    const db = getDatabase(app);
    const atuadorRef = ref(db, '/atuador');
    set(atuadorRef, {
      estado: newState
    });
    this.doorStateOpen = newState;
  }

  private initCharts() {
    // Luminosity Chart
    if (this.luminosityChartRef) {
      this.luminosityChart = new Chart(this.luminosityChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Red', 'Green', 'Blue', 'Clear'],
          datasets: [{
            label: 'Luminosity Values',
            data: [0, 0, 0, 0],
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(201, 203, 207, 0.7)'
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(75, 192, 192)',
              'rgb(54, 162, 235)',
              'rgb(201, 203, 207)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              // static scale: 0..255 for RGB sensor values
              min: 0,
              max: 255,
              title: {
                display: true,
                text: 'Light Intensity'
              },
              ticks: {
                // optional: keep ticks readable
                stepSize: 51
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Luminosity Sensor Data',
              font: {
                size: 18
              }
            },
            legend: {
              display: false
            }
          }
        }
      });
    }

    // Input/Output Chart
    if (this.ioChartRef) {
      this.ioChart = new Chart(this.ioChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Entrada', 'Saída', 'Pessoas no local'],
          datasets: [{
            label: 'I/O Values',
            // match labels: entrada, saida, pessoas
            data: [0, 0, 0],
            backgroundColor: [
              'rgba(75, 192, 192, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(153, 102, 255, 0.7)'
            ],
            borderColor: [
              'rgb(75, 192, 192)',
              'rgb(255, 159, 64)',
              'rgb(153, 102, 255)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              // static scale: 0..30 for entradas/saidas/people
              min: 0,
              max: 30,
              title: {
                display: true,
                text: 'Quantidade'
              },
              ticks: {
                stepSize: 5
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Entradas/Saídas',
              font: {
                size: 18
              }
            },
            legend: {
              display: false
            }
          }
        }
      });
    }
  }

  private updateCharts() {
    if (!this.firebaseData || !this.firebaseData.sensor) {
      return;
    }

    const sensor = this.firebaseData.sensor;

    // Update Luminosity Chart
    if (this.luminosityChart && sensor.luminosity) {
      this.luminosityChart.data.datasets[0].data = [
        sensor.luminosity.red || 0,
        sensor.luminosity.green || 0,
        sensor.luminosity.blue || 0,
        sensor.luminosity.clear || 0
      ];
      this.luminosityChart.update();
    }

    // Update I/O Chart
    if (this.ioChart) {
      this.ioChart.data.datasets[0].data = [
        sensor.entrada || 0,
        sensor.saida || 0,
        this.currentPeopleCount || 0
      ];
      this.ioChart.update();
    }
  }
}
