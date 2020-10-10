import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Observable, Observer } from 'rxjs';
import { remote, dialog } from 'electron';
declare var require: any;
declare var externalFunction: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  intervalId: any;
  timeOutId: any;
  userInfo = JSON.parse(localStorage.getItem('currentUser'));
  base64data: any;
  baseArray: any = [];
  callback: any;
  handleStream: any;
  handleError: any;
  timeString: any;

  timeout: any;
  seconds = 0;
  minutes = 45;
  hours = 4;
  running = false;
  isFirst = true;
  constructor(public _userService: UserService, public router: Router) {
    localStorage.setItem('isRunning', JSON.stringify(this.running));
    console.log(moment().format('DD-MM-yyyy'));
  }

  ngOnInit() {
    if (!this.userInfo) {
      this.router.navigate(['/login']);
      // console.log("not working");
    }
    remote.getCurrentWindow().on('close', (e) => {
      if (JSON.parse(localStorage.getItem('isRunning'))) {
        const choice = dialog.showMessageBox(
          remote.getCurrentWindow(),
          {
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Confirm',
            message: 'Your timer is running. Do you really want to close the application?'
          }
        )
        console.log(choice);
        if (choice) {
          const logs = {
            date: moment().format('DD-MM-yyyy'),
            time: {
              hours: this.hours,
              minutes: this.minutes,
              seconds: this.seconds
            }
          };
          localStorage.setItem('logs', JSON.stringify(logs));
          this._userService.storeLogs(logs).subscribe(res => e.preventDefault(), err => console.log(err));
        }
      }
    })
    this._userService.getLogs().subscribe(async (res: any) => {
      const logs = {
        date: res.logs.date,
        time: res.logs.time
      };
      console.log(logs);
      await localStorage.setItem('logs', JSON.stringify(logs));
      this.hours = JSON.parse(localStorage.getItem('logs')).time.hours;
      this.minutes = JSON.parse(localStorage.getItem('logs')).time.minutes;
      this.seconds = JSON.parse(localStorage.getItem('logs')).time.seconds;
    }, err => {
      console.log(err)
    })
  }

  startCapturing() {
    if (this.isFirst) {
      const randomTime = _.random(0, 1000 * 60 * 15);
      this.timeout = setTimeout(() => {
        if (this.running) {
          this.external();
        }
      }, randomTime);
    }
    this.intervalId = setInterval(() => {
      const randomTime = _.random(0, 1000 * 60 * 15);
      this.timeout = setTimeout(() => {
        if (this.running) {
          this.external();
        }
      }, randomTime);
    }, 1000 * 60 * 15);
  }

  dataURItoBlob(dataURI: string): Observable<Blob> {
    return Observable.create((observer: Observer<Blob>) => {
      const byteString: string = atob(dataURI);
      const arrayBuffer: ArrayBuffer = new ArrayBuffer(byteString.length);
      const int8Array: Uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        int8Array[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([int8Array], { type: "image/png" });
      observer.next(blob);
      observer.complete();
    });
  }

  b64toBlob(b64Data, contentType?, sliceSize?) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  getPaddedVal(val) {
    return '0' + val;
  }

  async external() {
    // await this.fullscreenScreenshot((base64data) => {
    //   localStorage.setItem('imgUrl', JSON.stringify(base64data));
    // }, 'image/png');
    await externalFunction();
    setTimeout(() => {
      this.base64data = JSON.parse(localStorage.getItem("imgUrl")).split(',').reverse()[0];
      // console.log(this.base64data);
      const imageBlob: Blob = this.b64toBlob(this.base64data, "image/png");
      const imageName: string = `${JSON.parse(localStorage.getItem('currentUser')).name}-${moment().format("DD-MM-yyyy-HH-mm-ss")}`;
      const imageFile: File = new File([imageBlob], imageName, {
        type: "image/png"
      });
      // console.log(imageFile);
      const formData = new FormData();
      formData.append('userId', JSON.parse(localStorage.getItem('currentUser'))._id);
      formData.append('time', `${String(this.hours).length === 1 ? this.getPaddedVal(this.hours) : this.hours}-${String(this.minutes).length === 1 ? this.getPaddedVal(this.minutes) : this.minutes}-${String(this.seconds).length === 1 ? this.getPaddedVal(this.seconds) : this.seconds}`);
      formData.append('uploadFile', imageFile);

      this._userService.uploadbase64Img(formData).subscribe((res) => {
        // console.log("the res is the ==========>", res);
        clearTimeout(this.timeout);
        this.isFirst = false;
      }, (err) => {
        // console.log("the err is the ==========>", err);
      })

    }, 500);
  }

  async logout() {
    await this.stop();
    await localStorage.removeItem('currentUser');
    this.router.navigate(['login']);
  }

  timer() {
    this.timeOutId = setTimeout(() => {
      this.updateTime();
      this.timer();
    }, 1000);
  }

  updateTime() {
    this.seconds++;
    if (this.seconds === 60) {
      this.seconds = 0;
      this.minutes++;
    }

    if (this.minutes === 60) {
      this.minutes = 0;
      this.hours++;
    }


  }

  async stop() {
    await clearTimeout(this.timeOutId);
    this.running = false;
    await localStorage.setItem('isRunning', JSON.stringify(this.running));
    const logs = {
      date: moment().format('DD-MM-yyyy'),
      time: {
        hours: this.hours,
        minutes: this.minutes,
        seconds: this.seconds
      }
    };
    await localStorage.setItem('logs', JSON.stringify(logs));
    await this._userService.storeLogs(logs).subscribe(res => console.log(res), err => console.log(err));
    await clearInterval(this.intervalId);
  }

  start() {
    if(!this.running) {
      this.timer();
      this.running = true;
      localStorage.setItem('isRunning', JSON.stringify(this.running));
      this.startCapturing();
    }
  }

  clear() {
    this.seconds = 0;
    this.minutes = 0;
    this.running = false;
    localStorage.setItem('isRunning', JSON.stringify(this.running));
    clearInterval(this.intervalId);
  }
  // fullscreenScreenshot = (callback, imageFormat) => {
  //   var _this = this;
  //   this.callback = callback;
  //   imageFormat = imageFormat || 'image/jpeg';
  //   this.handleStream = (stream) => {
  //     var video = document.createElement('video');
  //     video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';

  //     video.onloadedmetadata = function () {
  //       video.play();

  //       var canvas = document.createElement('canvas');
  //       canvas.id = "canvas";
  //       var ctx = canvas.getContext('2d');
  //       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  //       const dataUrl = canvas.toDataURL();
  //       var image = new Image();
  //       image.src = canvas.toDataURL();

  //       if (_this.callback) {
  //         _this.callback(canvas.toDataURL(imageFormat));
  //       } else {
  //         // console.log('Need callback!');
  //       }

  //       video.remove();
  //       try {
  //         stream.getTracks()[0].stop();
  //       } catch (e) { }
  //     }

  //     video.srcObject = stream;
  //     document.body.appendChild(video);
  //   };

  //   this.handleError = function (e) {
  //     // console.log(e);
  //   };

  //   desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
  //     for (const source of sources) {
  //       if ((source.name === "Entire Screen") || (source.name === "Screen 1") || (source.name === "Screen 2")) {
  //         try {
  //           const stream = await (<any>navigator.mediaDevices).getUserMedia({
  //             audio: false,
  //             video: {
  //               mandatory: {
  //                 chromeMediaSource: 'desktop',
  //                 chromeMediaSourceId: source.id,
  //                 minWidth: 1280,
  //                 maxWidth: 4000,
  //                 minHeight: 720,
  //                 maxHeight: 4000
  //               }
  //             }
  //           });
  //           _this.handleStream(stream);
  //         } catch (e) {
  //           _this.handleError(e);
  //         }
  //       }
  //     }
  //   });
  // }
}


