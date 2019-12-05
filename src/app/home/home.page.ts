import { Component, OnInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { Platform, LoadingController } from '@ionic/angular';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  CameraPosition,
  MarkerOptions,
  Marker,
  Environment,
  GoogleMapsAnimation,
  Geocoder,
  ILatLng
} from '@ionic-native/google-maps';
import { dismiss } from '@ionic/core/dist/types/utils/overlays';
import { Routes } from '@angular/router';
declare var google: any;


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  // @ViewChild('map', { static: false }) mapElement: any;
  @ViewChild('map', { static: true }) mapElement: any;
  private loading: any;
  map: GoogleMap;
  search: string = '';
  private googleAutocomplete = new google.maps.places.AutocompleteService();
  public searchResults = new Array<any>();
  public originMarket: Marker;
  public destination: any;
  private googleDirectionsService = new google.maps.DirectionsService();


  constructor(private platform: Platform,
    private loadingCtrl: LoadingController,
    private ngZone: NgZone) {
    console.log(google);


  }


  ngOnInit() {
    this.mapElement = this.mapElement.nativeElement;
    this.mapElement.style.width = this.platform.width() + 'px';
    this.mapElement.style.height = this.platform.height() + 'px';
    this.loadMap();

  }
  async loadMap() {
    this.loading = await this.loadingCtrl.create({
      message: 'Espere...'
    });
    await this.loading.present();


    Environment.setEnv({
      'API_KEY_FOR_BROWSER_RELEASE': 'AIzaSyBjQABSVm5-I00LBgQ42KKlQo9vGJgH5XA',
      'API_KEY_FOR_BROWSER_DEBUG': 'AIzaSyBjQABSVm5-I00LBgQ42KKlQo9vGJgH5XA'
    });

    let mapOptions: GoogleMapOptions = {
      controls: {
        zoom: false
      }

    };

    this.map = GoogleMaps.create(this.mapElement, mapOptions);
    try {
      await this.map.one(GoogleMapsEvent.MAP_READY);
      this.addOriginMarker();
    } catch (error) { }
  }

  async addOriginMarker() {
    try {
      const myLocation: any = await this.map.getMyLocation();
      this.map.moveCamera({
        target: myLocation.latLng,
        zoom: 18
      });

      this.originMarket = this.map.addMarkerSync({
        Title: 'Aqui Estoy',
        icon: '#800080',
        animation: GoogleMapsAnimation.DROP,
        position: myLocation.latLng
      });
      // tslint:disable-next-line: align
    } catch (error) {
      console.error(error);
    } finally {
      // cuando teermine de cargar el mapa cierre el loading
      this.loading.dismiss();
    }
  }

  searchChanged() {
    if (!this.search.trim().length) return;

    this.googleAutocomplete.getPlacePredictions({ input: this.search }, predictions => {
      this.ngZone.run(() => {
        this.searchResults = predictions;
      });
    });
  }

  async calcRoute(result: any) {
    this.search = '';
    this.destination = result;

    const info: any = await Geocoder.geocode({ address: this.destination.description });

    let marketDestination: Marker = this.map.addMarkerSync({
      title: this.destination.description,
      icon: '#000',
      animation: GoogleMapsAnimation.DROP,
      position: info[0].position
    });

    this.googleDirectionsService.route({
      origin: this.originMarket.getPosition(),
      destination: marketDestination.getPosition(),
      travelMode: 'DRIVING'
    }, async results => {
      const points = new Array<ILatLng>();
      const routes = results.routes[0].overview_path;

      for (let i = 0; i < routes.lenght; i++) {
        points[i] = {
          lat: routes[i].lat(),
          lng: routes[i].lng()
        }
      }
      await this.map.addPolylineSync({
        points: points,
        color: '#000',
        width: 3,
      })
      this.map.moveCamera({ target: points })
    });
  }
}
