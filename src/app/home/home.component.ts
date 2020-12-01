import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UserService } from '../services/user.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { saveAs } from 'file-saver';
import * as socketIO from 'socket.io-client';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Observable, Observer, Subscription } from 'rxjs';
import { remote, dialog, ipcRenderer } from 'electron';
declare var require: any;
declare var externalFunction: any;
declare var $: any;
import { startWith } from 'rxjs/operators';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import Swal from 'sweetalert2'





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
  minutes = 0;
  hours = 0;
  running = false;
  isFirst = true;

  userLogDetails: any;
  fs: any;
  inActivityTime: any;
  inActivityStatus: any = 'active';
  inActivityTimeInterval: any

  // currentDate:any = moment().format('DD-MM-yyyy');
  currentDate: any = new Date().toISOString().split("T")[0] + "T18:30:00.000Z";

  currentTime: any = moment().utcOffset("+05:30").format('h:mm:ss a');
  jsonFilePath: any;
  imageFilesPath: any;

  timeOutFlag: boolean = false;
  socket: any;

  /*Socket variables*/
  screenShotRequest: Observable<string[]>;
  config: SocketIoConfig = { url: 'http://localhost:3000', options: {} };

  private _docSub: Subscription;


  constructor(public _userService: UserService,
    public router: Router,
    private _socket: Socket,
    private _change: ChangeDetectorRef) {
    this.fs = (window as any).fs;
    localStorage.setItem("isHomeComponent", "true");



  }


  ngOnInit() {
    $("#stop").addClass('disable');
    $("#start").removeClass('disable');
    console.log(this._socket.subscribersCounter);
    this._socket.on('screenShotRequest', (data) => {
      console.log("Data on nce =======>", data);
      this.external(true);
    });



    console.log(remote.app.getPath("userData"));
    if (!this.userInfo) {
      this.router.navigate(['/login']);

    }
    this.imageFilesPath = remote.app.getPath("userData") + "/" + this.userInfo._id + "/";
    this.jsonFilePath = remote.app.getPath("userData") + "/" + this.userInfo._id + ".json";


    console.log();

    remote.getCurrentWindow().on("close", (event) => {
      event.preventDefault();
    });


    remote.getCurrentWindow().on('close', (e) => {
      console.log(e);

      // e.preventDefault();
      if (JSON.parse(localStorage.getItem('isRunning'))) {
        const choice = remote.dialog.showMessageBox(
          remote.getCurrentWindow(),
          {
            type: 'question',
            buttons: ['No', 'Yes'],
            title: 'Confirm',
            message: 'Your timer is running. Do you really want to close the application?',
            detail: "Closing app will stop your timer."
          }
        )
          .then(async (res) => {
            console.log(res.response);
            if (res.response) {
              const logs = {
                date: moment().format('DD-MM-yyyy'),
                time: {
                  hours: this.hours,
                  minutes: this.minutes,
                  seconds: this.seconds
                }
              };
              await this.checkStatus("offline")
              await this.stop()

              localStorage.setItem('logs', JSON.stringify(logs));
              this._userService.storeLogs(logs).subscribe((res) => {
                remote.app.exit(0);
                console.log("Helloooo");


              }, (err) => {
                console.log(err)
              });
            }


          })
      }
      else {
        remote.app.exit(0);
      }
    });
    this.getLogs();


    this.checkLastLog();
  }

  getLogs() {
    this._userService.getLogs().subscribe(async (res: any) => {
      if (res.logs) {
        const logs = {
          date: res.logs.date,
          time: res.logs.time
        };
        console.log(logs);
        await localStorage.setItem('logs', JSON.stringify(logs));
        this.hours = JSON.parse(localStorage.getItem('logs')).time.hours;
        this.minutes = JSON.parse(localStorage.getItem('logs')).time.minutes;
        this.seconds = JSON.parse(localStorage.getItem('logs')).time.seconds;
        return
      }
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



  async external(screenShotRequested?) {

    await externalFunction();
    setTimeout(() => {
      this.base64data = JSON.parse(localStorage.getItem("imgUrl")).split(',').reverse()[0];

      const imageBlob: Blob = this.b64toBlob(this.base64data, "image/png");
      const imageName: string = `${JSON.parse(localStorage.getItem('currentUser')).name}-${moment().format("DD-MM-yyyy-HH-mm-ss")}`;
      const imageFile: File = new File([imageBlob], imageName, {
        type: "image/png"
      });

      const formData = new FormData();
      formData.append('userId', JSON.parse(localStorage.getItem('currentUser'))._id);
      formData.append('time', `${String(this.hours).length === 1 ? this.getPaddedVal(this.hours) : this.hours}-${String(this.minutes).length === 1 ? this.getPaddedVal(this.minutes) : this.minutes}-${String(this.seconds).length === 1 ? this.getPaddedVal(this.seconds) : this.seconds}`);
      formData.append('uploadFile', imageFile);
      console.log("Image file ======>", imageFile);


      /*Check if screen is requested of not*/
      console.log("screenShotRequested ===>", screenShotRequested);
      if (screenShotRequested) {
        this._userService.sendScreenShot({
          imageFile: this.base64data,
          imageName,
          id: this.userInfo._id
        });
      }


      this.fs.writeFile(this.imageFilesPath + imageName + ".png", this.base64data, 'base64', (err) => {
        if (err) {
          return console.error(err)

        }
        else {
          console.log('file saved to ', this.imageFilesPath + imageName);
          this.syncData('image', this.imageFilesPath + imageName + ".png");

        }
        clearTimeout(this.timeout);


      });
    }, 500);
  }

  async logout() {
    this._userService.disconnetSocket();

    console.log(navigator.onLine);

    Swal.fire({
      title: 'Are you sure?',
      text: "This will stop your timmer!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (navigator.onLine && localStorage.getItem("isLatestVersion") == "false") {
          console.log("You are online");
          await this.checkStatus("offline")
          await this.stop()

          setTimeout(() => {
            this.updateData();

          }, 1000)
          await localStorage.removeItem('currentUser');
          this.router.navigate(['login']);
        }
        else if (navigator.onLine && localStorage.getItem("isLatestVersion") == "true") {
          await this.checkStatus("offline")
          await localStorage.removeItem('currentUser');
          this.router.navigate(['login']);
        }
        else {
          Swal.fire(
            'The Internet?',
            'Please check your internet connection?',
            'question'
          )
          console.log("You are offline");
        }
      }
    })


  }

  timer() {
    this.timeOutId = setTimeout(() => {
      console.log("times()", moment().utcOffset("+05:30").format('h:mm:ss a'));
      if (!this.timeOutFlag) {
        this.syncData('start', moment().utcOffset("+05:30").format('h:mm:ss a'));
        this.timeOutFlag = true;
      }
      this.updateTime();
      this.timer();
    }, 1000);
  }

  updateTime() {
    // alert("Timmer called")
    this.seconds++;
    if (this.seconds === 60) {
      this.seconds = 0;
      this.minutes++;
    }

    if (this.minutes === 60) {
      this.minutes = 0;
      this.hours++;
    }

    this._change.detectChanges();
  }

  async stop() {


    await clearTimeout(this.timeOutId);
    this.running = false;
    console.log("stop()", moment().utcOffset("+05:30").format('h:mm:ss a'));
    await localStorage.setItem('isRunning', JSON.stringify(this.running));
    const logs = {
      date: moment().format('DD-MM-yyyy'),
      time: {
        hours: this.hours,
        minutes: this.minutes,
        seconds: this.seconds
      }
    };

    if (this.timeOutFlag) {
      await this.syncData('stop', moment().utcOffset("+05:30").format('h:mm:ss a'));
      $("#stop").addClass('disable');
      $("#start").removeClass('disable');
    }
    this.timeOutFlag = false;

    await localStorage.setItem('logs', JSON.stringify(logs));
    await this._userService.storeLogs(logs).subscribe(res => console.log(res), err => console.log(err));
    await clearInterval(this.intervalId);
  }

  start() {
    console.log("!this.running ==>", !this.running);

    if (!this.running) {
      this.timer();
      $("#start").addClass('disable');
      $("#stop").removeClass('disable');
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


  async syncData(flag, logTime?) {
    console.group("syncData");
    console.log("Flag ==>", flag);
    if (this.fs.existsSync(this.jsonFilePath)) {
      console.log("Files exitssss");
      await this.fs.readFile(this.jsonFilePath, async (err, data) => {

        if (err) console.log("error", err);
        else {
          console.log(JSON.parse(data));
          this.userLogDetails = JSON.parse(data);



          console.log("Data", data.toString('utf-8'));
          await this.updateRecordFile(flag, this.userLogDetails, logTime);
          return
        }

      });
    }
    else {
      console.log("File does not exist");
      return
    }
    console.groupEnd();
  }

  async updateRecordFile(flag, userLogDetails, logTime?) {
    console.group("updateRecordFile");
    console.log(flag, userLogDetails);

    let lastAttendanceLog = userLogDetails.attendance[userLogDetails.attendance.length - 1];
    console.log(lastAttendanceLog)
    if ((!lastAttendanceLog) || (lastAttendanceLog.date != this.currentDate)) {
      userLogDetails.attendance.push({
        date: this.currentDate,
        timeLog: [],
        difference: '-',
        inActivityTime: 0,
        images: []
      });
    }

    lastAttendanceLog = userLogDetails.attendance[userLogDetails.attendance.length - 1];
    console.log(lastAttendanceLog)
    const previousInActivityTime = lastAttendanceLog.inActivityTime;

    switch (flag) {
      case "start":
        this.inActivityTimeInterval = setInterval(async () => {
          await this.calculateInactivityTime(userLogDetails, previousInActivityTime);
        }, 1000);
        let timeLogObject: any = {};
        timeLogObject = {
          in: logTime,
          out: "-"
        }
        lastAttendanceLog.timeLog.push(timeLogObject);



        break;

      case "stop":
        clearInterval(this.inActivityTimeInterval);
        let lastTimeLogObject = lastAttendanceLog.timeLog[lastAttendanceLog.timeLog.length - 1];
        console.log("lastAttendanceLog", lastTimeLogObject);

        lastTimeLogObject.out = logTime;
        lastAttendanceLog = await this.calculateDifference(lastAttendanceLog)

        break;

      case "image":
        lastAttendanceLog.images.push({ path: logTime });
        break;
      case "resumeTime":
        this.inActivityTimeInterval = setInterval(async () => {
          await this.calculateInactivityTime(userLogDetails, previousInActivityTime);
        }, 1000);
        break;
      default:
        // code...
        break;
    }

    console.log("userLogDetails ==>", userLogDetails);

    userLogDetails.isLatestVersion = false;
    localStorage.setItem("isLatestVersion", "false");
    await this.fs.writeFileSync(this.jsonFilePath, JSON.stringify(userLogDetails));
    return;



    console.groupEnd();
  }


  calculateDifference(currentAttendanceLog) {
    console.group('calculateDifference', currentAttendanceLog);
    var in1 = currentAttendanceLog.timeLog[currentAttendanceLog.timeLog.length - 1].in;
    var out = currentAttendanceLog.timeLog[currentAttendanceLog.timeLog.length - 1].out;
    var inn = moment(in1, 'hh:mm:ss: a').diff(moment().startOf('day'), 'seconds');
    var outt = moment(out, 'hh:mm:ss: a').diff(moment().startOf('day'), 'seconds');

    let seconds = outt - inn;
    if (currentAttendanceLog.difference != "-") {
      var difference = moment(currentAttendanceLog.difference, 'hh:mm:ss: a').diff(moment().startOf('day'), 'seconds');

      seconds = seconds + difference;
    }

    seconds = Number(seconds);
    var h = Math.floor(seconds / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 3600 % 60);

    var time = ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);

    console.log("time ==========+>", time);
    currentAttendanceLog.difference = time;
    currentAttendanceLog.status = "Absent";

    return currentAttendanceLog
    console.groupEnd();
  }


  calculateInactivityTime(userLogDetails, previousInActivityTime) {
    console.group("calculateInactivityTime");
    let lastAttendanceLog = userLogDetails.attendance[userLogDetails.attendance.length - 1];

    if (!remote.powerMonitor.getSystemIdleTime() && this.inActivityStatus == 'idle') {
      console.log("In if part");
      lastAttendanceLog.inActivityTime = lastAttendanceLog.inActivityTime + this.inActivityTime;
      console.log("userLogDetails =====>", userLogDetails);
      this.inActivityStatus = 'active'

      userLogDetails.isLatestVersion = false;
      localStorage.setItem("isLatestVersion", "false");

      this.fs.writeFileSync(this.jsonFilePath, JSON.stringify(userLogDetails));

    }
    else if (remote.powerMonitor.getSystemIdleState(5) == 'idle') {
      // console.log("In else if part");
      this.inActivityStatus = 'idle'
      this.inActivityTime = remote.powerMonitor.getSystemIdleTime();
    }
    else {
      // console.log("In else part");
    }


    console.groupEnd();
  }


  /*API call*/
  /*Update data to database*/
  updateData() {
    console.group("updateData");

    /*Fetch json file*/




    this.fs.readFile(this.jsonFilePath, async (err, data) => {

      if (err) {
        return false
        console.log("error", err);
      }
      else {
        console.log(JSON.parse(data));
        const userLogDetails = JSON.parse(data);

        /*Check for lastest version*/
        if (!userLogDetails.isLatestVersion) {
          // Select the image

          let formData = new FormData();
          let details = await this.appendFilesToJson(userLogDetails);



          details.append('jsonData', JSON.stringify(userLogDetails));
          details.append('userId', this.userInfo._id);
          console.log(userLogDetails, details);
          await this._userService.uploadbase64Img(details).subscribe((res) => {
            console.log("the res is the ==========>", res);
            // this.syncData('image', res.files[0]);
            this.removeDataFromJsonFile(res)
            this.isFirst = false;
            return true;
          }, (err) => {
            return false;
            console.log("the err is the ==========>", err);
          })

        }
        else {
          console.log("Latest log");
        }
      }

    });
    console.groupEnd();
  }


  appendFilesToJson(userLogDetails) {
    const formData = new FormData();
    // formData.append('userLogDetails',JSON.stringify(userLogDetails));            

    _.forEach(userLogDetails.attendance, (singleAttendance, logIndex) => {
      console.log(singleAttendance);
      _.forEach(singleAttendance.images, async (singleImage, imageIndex) => {
        console.log(singleImage);
        const contents = this.fs.readFileSync(singleImage.path, { encoding: 'base64' });
        console.log(contents)

        const imageBlob: Blob = await this.b64toBlob(contents, "image/png");
        console.log(imageBlob);

        let imageName = singleImage.path.split("/")
        imageName = imageName[imageName.length - 1];
        console.log(imageName)
        const imageFile: File = new File([imageBlob], imageName, {
          type: "image/png"
        });
        // console.log(userLogDetails.attendance[logIndex].images);
        formData.append('uploads', imageFile, imageName);
        singleImage.path = userLogDetails._id + '/' + imageName;
        // userLogDetails.attendance[logIndex].images[imageIndex]["file"] = imageFile;
      });
    });
    console.log(userLogDetails)
    formData.append('userLogDetails', JSON.stringify(userLogDetails));


    return formData;
  }


  /*Check online offline status of user*/
  checkStatus(status) {

    console.log(navigator.onLine);
    const object = {
      status,
      user: this.userInfo._id
    }
    this._userService.changeStatus(object)
  }


  removeDataFromJsonFile(res) {
    this.fs.readFile(this.jsonFilePath, async (err, data) => {
      const userLogDetails = JSON.parse(data);
      userLogDetails.attendance = []
      userLogDetails.versionId = res.versionId
      userLogDetails['isLatestVersion'] = true;
      localStorage.setItem("isLatestVersion", "true");
      this.fs.writeFileSync(this.jsonFilePath, JSON.stringify(userLogDetails));
    });

    const files = this.fs.readdirSync(this.imageFilesPath)

    if (files.length > 0) {
      files.forEach((filename) => {
        this.fs.unlinkSync(this.imageFilesPath + "/" + filename)
      })
    } else {
      console.log("No files found in the directory.")
    }
  }

  checkLastLog() {
    // this.fs.readFile(this.jsonFilePath, async (err, data) => {
    //   const userLogDetails = JSON.parse(data);
    //   console.log(userLogDetails);
    //   let attendanceLog = userLogDetails.attendance[userLogDetails.attendance.length - 1]
    //   console.log(attendanceLog);


    //   if (attendanceLog && attendanceLog.timeLog.length && attendanceLog.timeLog[attendanceLog.timeLog.length - 1].out == '-') {
    //     $("#start").addClass('disable');
    //     this.running = false
    //     this.timeOutFlag = true;
    //     await this.getLogs();
    //     this.start();
    //     this.syncData("resumeTime");

    //     $("#stop").removeClass('disable');
    //   }
    //   else {
    //     $("#stop").addClass('disable');
    //     $("#start").removeClass('disable');
    //   }
    // });
  }





  // fullscreenScreenshot = (callback, imageFormat) => {
  //   var _this = this;
  //   this.callback = callback;
  //   imageFormat = imageFormat || 'image/jpeg';
  //   this.handleStream = (stream) => {
  //     var video = document.createElement('video');
  //     video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';

  //     video.onloadedmetadata = function () {
  //       video.play();async 

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

  ch(e) { }
  //     }

  //     video.srcObject = stream;
  //     document.body.appendChild(video);
  //   };

  //   this.handleError = function (e) {
  //     // console.log(e);
  //   };        await this.calculateD


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


