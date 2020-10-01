import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
declare var require: any;
declare var externalFunction: any;
// const path = require("path");
// var fs = require('fs');
// const {desktopCapturer} = require('electron');

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  intervalId: any;
  userInfo = JSON.parse(localStorage.getItem('currentUser'));
  base64data: any;
  baseArray: any = [];
  second: any;
  callback: any;
  handleStream: any;
  handleError: any;
  timeString: any;

  constructor(public _userService: UserService, public router: Router) {
  }

  ngOnInit() {
    if (this.userInfo) {
      this.getCurrentDate();
    }
    else {
      this.router.navigate(['/login']);
      console.log("not working");
    }

  }
  convertTime
  getCurrentDate() {
    this.intervalId = setInterval(() => {
      this.second = moment().format('mm:ss');
      console.log("the second is the =====>", this.second);
      var minuteFix = Math.floor(Math.random() * 1 * 60 * 1000);
      console.log("the minuteFix is the ===>", minuteFix);
      var tempTime = moment.duration(minuteFix);
      this.convertTime = tempTime.minutes() + ":" + tempTime.seconds();
      var convertUtc = moment(this.convertTime).format('mm:ss');
      console.log("the data os the ========>", convertUtc, this.convertTime, this.second, "===================+>", tempTime);
      this.base64data = JSON.parse(localStorage.getItem("imgUrl"));
      // console.log("the item get is the ===>", JSON.parse(localStorage.getItem("imgUrl")));
      // if (this.convertTime) {

      // this.external();
      // }
    }, 10000);
  }


  currentTime
  generateRandomDate() {

    // var timer = setInterval(clock, 1000);

    // function clock() {
    //   msec += 1;
    //   if (msec == 60) {
    //     sec += 1;
    //     msec = 0;
    //     if (sec == 60) {
    //       sec = 0;
    //       min += 1;
    //       if (sec % 2 == 0) {
    //         alert("Pair");
    //       }
    //     }
    //   }
    //   document.getElementById("timer").innerHTML = min + ":" + sec + ":" + msec;
    // }

    var h1 = document.getElementsByTagName('h1')[0],
      start = document.getElementById('start'),
      stop = document.getElementById('stop'),
      clear = document.getElementById('clear'),
      seconds = 0, minutes = 0, hours = 0,
      t;

    function add() {
      seconds++;
      if (seconds >= 60) {
        seconds = 0;
        minutes++;
        if (minutes >= 60) {
          minutes = 0;
          hours++;
        }
      }

      h1.textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds);

      timer();
    }
    function timer() {
      t = setTimeout(add, 1000);
    }
    timer();


    /* Start button */
    start.onclick = timer;

    /* Stop button */
    stop.onclick = function () {
      clearTimeout(t);
    }

    /* Clear button */
    clear.onclick = function () {
      h1.textContent = "00:00:00";
      seconds = 0; minutes = 0; hours = 0;
    }

  }

  external() {
    externalFunction();
    setTimeout(() => {
      this.baseArray.push(this.base64data);
      console.log("the item get is the ===>", this.base64data);

      this._userService.uploadbase64Img(this.base64data).subscribe((res) => {
        console.log("the res is the ==========>", res);
      }, (err) => {
        console.log("the err is the ==========>", err);
      })
    }, 500);
  }

  logout() {
    localStorage.removeItem('currentUser');
    clearInterval(this.intervalId);
    this.router.navigate(['login']);
  }
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
//         console.log('Need callback!');
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
//     console.log(e);
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