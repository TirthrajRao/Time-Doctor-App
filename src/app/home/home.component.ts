import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
const path = require("path");
var fs = require('fs');
const {desktopCapturer} = require('electron');
declare var require: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})


export class HomeComponent implements OnInit {
  intervalId:any;
  userInfo = JSON.parse(localStorage.getItem('currentUser'));
  base64data:any;
  baseArray:any = [];
  second:any;
  callback:any;
  handleStream:any;
  handleError:any;

  constructor(public _userService: UserService, public router: Router) { 
  }

  ngOnInit() {
    if (this.userInfo) {
      this.getCurrentDate();        
    }
    else{
      this.router.navigate(['/login']);
      console.log("not working");
    }
  }

  getCurrentDate() {
    this.intervalId = setInterval(() => {
      this.second = moment().format('s');
      if (this.second == 0) {
        this.externalFunction();
      }
    }, 1000); 
  }

  fullscreenScreenshot = (callback, imageFormat) => {
    var _this = this;
    this.callback = callback;
    imageFormat = imageFormat || 'image/jpeg';
    this.handleStream = (stream) => {
      var video = document.createElement('video');
      video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';

      video.onloadedmetadata = function () {
        video.play();

        var canvas = document.createElement('canvas');
        canvas.id = "canvas";
        var ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL();
        var image = new Image();
        image.src = canvas.toDataURL();
        
        if (_this.callback) {
          _this.callback(canvas.toDataURL(imageFormat));
        } else {
          console.log('Need callback!');
        }
        
        video.remove();
        try {
          stream.getTracks()[0].stop();
        } catch (e) {}
      }

      video.srcObject = stream;
      document.body.appendChild(video);
    };

    this.handleError = function(e) {
      console.log(e);
    };

    desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
      for (const source of sources) {
        if ((source.name === "Entire Screen") || (source.name === "Screen 1") || (source.name === "Screen 2")) {
          try{
            const stream = await (<any>navigator.mediaDevices).getUserMedia({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: source.id,
                  minWidth: 1280,
                  maxWidth: 4000,
                  minHeight: 720,
                  maxHeight: 4000
                }
              }
            });
            _this.handleStream(stream);
          } catch (e) {
            _this.handleError(e);
          }
        }
      }
    });
  }

  externalFunction() {
    this.fullscreenScreenshot((base64data) => {
      this.base64data = base64data;
      this.baseArray.push(this.base64data);
      console.log("the item get is the ===>", this.base64data);

      this._userService.uploadbase64Img(this.base64data).subscribe((res) => {
        console.log("the res is the ==========>", res);
      }, (err) => {
        console.log("the err is the ==========>", err);
      })
    }, 'image/png');   
  }

  logout(){
    localStorage.removeItem('currentUser');
    clearInterval(this.intervalId);
    this.router.navigate(['login']);
  }      
} 


