import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import * as moment from 'moment';
import { interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {

  constructor(public updates: SwUpdate) {
    console.log("update enable checking", updates.isEnabled)
      if (updates.isEnabled) {
        interval(1000).subscribe(() => {
          if(JSON.parse(localStorage.getItem("isRunning")))
            this.checkForUpdate();
        });
      }
  }
  
  public checkForUpdate(): void {
    console.log("checking for updates")
    console.log("time2", moment().utcOffset("+05:30").format('h:mm:ss a'));
    localStorage.setItem("lastTime", moment().utcOffset("+05:30").format('h:mm:ss a'));
  }

}