import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule }    from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { NumpadPipe } from './utils/numpad.pipe';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AppConfig } from '../environments/environment';
import { UpdateService } from './services/update.service';



// const config: SocketIoConfig = { url: 'http://localhost:3000/', options: {} };
const config: SocketIoConfig = { url: 'https://timedoctor.mylionsgroup.com:4444/', options: {} };
// const config: SocketIoConfig = { url: 'http://192.168.43.71:3000', options: {} }; //pr'S WIFI
// const config: SocketIoConfig = { url: 'http://192.168.1.66:3000', options: {} }; //Rao'S WIFI

// const config: SocketIoConfig = { url: 'http://132.146.160.69:3000', options: {} }; // rao parasbhai


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    NumpadPipe,
    
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    SocketIoModule.forRoot(config),
    // ServiceWorkerModule.register('ngsw-worker.js', { enabled: AppConfig.production }),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: true }),
  
  ],
  providers: [UpdateService],
  bootstrap: [AppComponent]
})
export class AppModule { }
