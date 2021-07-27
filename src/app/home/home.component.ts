import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UserService } from '../services/user.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { saveAs } from 'file-saver';
import * as socketIO from 'socket.io-client';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Observable, Observer, Subscription, interval } from 'rxjs';
import { remote, dialog, ipcRenderer, nativeImage } from 'electron';
declare var require: any;
declare var externalFunction: any;
declare var $: any;
import { startWith } from 'rxjs/operators';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import Swal from 'sweetalert2'
const fsystem = require('fs');
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

  base64: any;
  diff: any;
  time: any;
  timeout: any;
  seconds = 0;
  minutes = 0;
  hours = 0;
  running = false;
  isFirst = true;
  loading = false;
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
  config: SocketIoConfig = { url: 'http://localhost:3000/', options: {} };
  // config: SocketIoConfig = { url: 'https://timedoctor.mylionsgroup.com:4444/', options: {} };

  private _docSub: Subscription;


  constructor(public _userService: UserService,
    public router: Router,
    private _socket: Socket,
    private _change: ChangeDetectorRef) {
    this.fs = (window as any).fs;
    localStorage.setItem("isHomeComponent", "true");

    /**
     * In an every 10 second of interval, this function checks system is connected to internet or not
     * if user is connected with internet, it checks the temp folder named with userId,
     * any images found inside folder it will upload to server and delete it from local
     */
    interval(10000).subscribe(x => {
      const files = fsystem.readdirSync(this.imageFilesPath)
      if (navigator.onLine && files.length) {
        // getting image file from local system folder
        for (const file of files) {
          (async () => {
            var imagePath = this.imageFilesPath + "/" + file;
            console.log("image path", imagePath)
            const contents = this.fs.readFileSync(imagePath, { encoding: 'base64' });
            console.log("contents+++++++", contents)

            const imageBlob: Blob = await this.b64toBlob(contents, "image/png");
            console.log(imageBlob);

            let imageName = file;
            // imageName = imageName[imageName.length - 1];
            console.log(imageName)
            const imageFile: File = new File([imageBlob], imageName, {
              type: "image/png"
            });
            console.log("tempbase64", this.base64);
            console.log("base64", this.base64);
            console.log("file name", file, this.imageFilesPath);

            this._userService.sendImage({
              imageFile: imageFile,
              imageName: file.split('.').slice(0, -1).join('.'),
              id: this.userInfo._id
            })
            // deleting image from local folder named with userId
            this.fs.unlinkSync(this.imageFilesPath + "/" + file)
            // this.base64 =  await this.getBase64Image(this.imageFilesPath + "/" + file);
          })();
        }
      }
    });

  }


  ngOnInit() {
    $("#stop").addClass('disable');
    $("#start").removeClass('disable');

    console.log(this._socket.subscribersCounter);

    // checks that screenshot requested by admin?
    this._socket.on('screenShotRequest', (data) => {
      console.log("Data on nce =======>", data);
      this.external(true);
    });

    console.log(remote.app.getPath("userData"));

    // if user info not found redirect to login
    if (!this.userInfo) {
      this.router.navigate(['/login']);
    }
    // image file path
    this.imageFilesPath = remote.app.getPath("userData") + "/" + this.userInfo._id + "/";
    // json file path
    this.jsonFilePath = remote.app.getPath("userData") + "/" + this.userInfo._id + ".json";

    console.log();

    // event handler, to prevent from closing window
    remote.getCurrentWindow().on("close", (event) => {
      event.preventDefault();
    });

    /**
     * event handler, to prevent from closing window
     * ask question, confirmation to close window
     *  */
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
              await setTimeout(() => {
                this.fs.readFile(this.jsonFilePath, async (err, data) => {
                  console.log("stop data=====>", data);
                  console.log(JSON.parse(data));
                  if (err) {
                    return false
                    console.log("error", err);
                  }
                  else {
                    console.log(JSON.parse(data));
                    const userLogDetails = JSON.parse(data);
          
                    /*Check for lastest version*/
                    if (!userLogDetails.isLatestVersion) {
                      let details = await this.appendFilesToJson(userLogDetails);
                      details.append('jsonData', JSON.stringify(userLogDetails));
                      details.append('userId', this.userInfo._id);
                      console.log(userLogDetails, details);
                      console.log("userLogDetails-----------", userLogDetails)
                      console.log("details-----------", details)
                      console.log("difference time", userLogDetails.attendance[userLogDetails.attendance.length - 1].difference)
                      const time = userLogDetails.attendance[userLogDetails.attendance.length - 1].difference
                      console.log("time", time)
                      const logs = {
                        date: moment().format('DD-MM-yyyy'),
                        time: {
                          hours: time.split(/[ :]+/)[0],
                          minutes: time.split(/[ :]+/)[1],
                          seconds: time.split(/[ :]+/)[2]
                        }
                      };
                      console.log("logs", logs)
                      // sends user time logs of the day
                      await this._userService.uploadbase64Img(details).subscribe((res) => {
                        console.log("the res is the ==========>", res);
                        // this.syncData('image', res.files[0]);
                        this.isFirst = false;
                        return true;
                      }, (err) => {
                        return false;
                        console.log("the err is the ==========>", err);
                      })
                      // adding last log into localStorage it will helps to calculate difference, next stopped time
                      await localStorage.setItem('logs', JSON.stringify(logs));
                      console.log("at the time of stop", logs);
                      await this._userService.storeLogs(logs).subscribe(res => console.log(res), err => console.log(err));
                      await this.getLogs();
                      this.loading = false;
                      $("#start").removeClass('disable');
                      console.log("loading",this.loading)
                      remote.app.exit(0)
                    }
                  }
                });
              }, 2000);
              // localStorage.setItem('logs', JSON.stringify(logs));
              // this._userService.storeLogs(logs).subscribe((res) => {
              //   remote.app.exit(0);
              //   console.log("Helloooo");
              // }, (err) => {
              //   console.log(err)
              // });
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


  // it gets today's time log from server
  getLogs() {
    this._userService.getLogs().subscribe(async (res: any) => {
      if (res.logs) {
        const logs = {
          date: res.logs.date,
          time: res.logs.time
        };
        console.log("get logs", logs);
        await this.fs.readFile(this.jsonFilePath, async (err, data) => {

          console.log("get local currentuser log difference", JSON.parse(data))
          let time = JSON.parse(data).attendance[JSON.parse(data).attendance.length - 1].difference;
          console.log("time", time)
          this.diff = time;
          localStorage.setItem("diff", time);
          console.log("diff1", this.diff)
          console.log("hours", (time.split(":")[0] == "-") ? 0 : time.split(":")[0])
          this.hours = (time.split(":")[0] == "-") ? 0 : time.split(":")[0];
          console.log("minutes", (time.split(":")[0] == "-") ? 0 : time.split(":")[1])
          this.minutes = (time.split(":")[0] == "-") ? 0 : time.split(":")[1];
          console.log("seconds", (time.split(":")[0] == "-") ? 0 : time.split(":")[2])
          this.seconds = (time.split(":")[0] == "-") ? 0 : time.split(":")[2];
        });
        console.log("diff2", this.diff)
        await localStorage.setItem('logs', JSON.stringify(logs));

        await localStorage.setItem('startLogs', JSON.stringify(logs));

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
    console.log("startCapturing")
    if (this.isFirst) {
      const randomTime = _.random(0, 1000 * 60 * 1);
      this.timeout = setTimeout(() => {
        if (this.running) {
          this.external();
        }
      }, randomTime);
    }
    this.intervalId = setInterval(() => {
      const randomTime = _.random(0, 1000 * 60 * 1);
      this.timeout = setTimeout(() => {
        if (this.running) {
          this.external();
        }
      }, randomTime);
    }, 1000 * 60 * 1);
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

  // converting base64 string to blob object
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

  // save screenshot into local system folder
  async external(screenShotRequested?) {
    console.log("external")

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
      console.log("external Image file ======>", imageFile);
      console.log("formdata before uploading:", formData)


      /*Check if screen is requested of not*/
      console.log("screenShotRequested ===>", screenShotRequested);
      if (screenShotRequested || navigator.onLine) {
        this._userService.sendScreenShot({
          imageFile: this.base64data,
          imageName,
          id: this.userInfo._id
        });
      }
      else {
        /**
         * if not it will store screenshots into local system folder
         */
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
      }

    }, 500);
  }


  async logout() {
    console.log("logout")

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
          await this.checkStatus("stopLogout")
          await this.stop()

          setTimeout(() => {
            this.updateData();

          }, 1000)
          // await localStorage.removeItem('currentUser');\
          var mydiff = localStorage.getItem('diff');
          await localStorage.clear();
          localStorage.setItem('diff', mydiff);
          this.router.navigate(['login']);
        }
        else if (navigator.onLine && localStorage.getItem("isLatestVersion") == "true") {
          await this.checkStatus("logout")
          // await localStorage.removeItem('currentUser');
          var mydiff = localStorage.getItem('diff');
          await localStorage.clear();
          localStorage.setItem('diff', mydiff);
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

  // timer each second it will update time
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

  // read file and convert image file to base64 format
  getBase64Image(img) {
    console.log("image in base64Image:", img)
    return new Promise((resolve, reject) => {

      const fileReader = new FileReader();
      fileReader.readAsDataURL(img);
      fileReader.onload = () => {
        console.log("fileReader:", fileReader)
        this.base64 = fileReader.result;
        resolve(fileReader.result)
      }
      fileReader.onerror = (error) => {
        reject(error);
      }
    })
  }

  // update time
  updateTime() {
    console.log("updateTime")
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

  // stop
  async stop() {
    console.log("Stop")
    this.loading = true;
    $("#start").addClass('disable');
    console.log("loading",this.loading)
    await clearTimeout(this.timeOutId);
    this.running = false;
    console.log("stop()", moment().utcOffset("+05:30").format('h:mm:ss a'));
    await localStorage.setItem('isRunning', JSON.stringify(this.running));


    if (this.timeOutFlag) {
      await this.syncData('stop', moment().utcOffset("+05:30").format('h:mm:ss a'));
      $("#stop").addClass('disable');

    }
    this.timeOutFlag = false;

    // on stop it read json file from system path and get difference time and update it to timelog in users collection and logs collection
    await setTimeout(() => {
      this.fs.readFile(this.jsonFilePath, async (err, data) => {
        console.log("stop data=====>", data);
        console.log(JSON.parse(data));
        if (err) {
          return false
          console.log("error", err);
        }
        else {
          console.log(JSON.parse(data));
          const userLogDetails = JSON.parse(data);

          /*Check for lastest version*/
          if (!userLogDetails.isLatestVersion) {
            let details = await this.appendFilesToJson(userLogDetails);
            details.append('jsonData', JSON.stringify(userLogDetails));
            details.append('userId', this.userInfo._id);
            console.log(userLogDetails, details);
            console.log("userLogDetails-----------", userLogDetails)
            console.log("details-----------", details)
            console.log("difference time", userLogDetails.attendance[userLogDetails.attendance.length - 1].difference)
            const time = userLogDetails.attendance[userLogDetails.attendance.length - 1].difference
            console.log("time", time)
            const logs = {
              date: moment().format('DD-MM-yyyy'),
              time: {
                hours: time.split(/[ :]+/)[0],
                minutes: time.split(/[ :]+/)[1],
                seconds: time.split(/[ :]+/)[2]
              }
            };
            console.log("logs", logs)
            // sends user time logs of the day
            await this._userService.uploadbase64Img(details).subscribe((res) => {
              console.log("the res is the ==========>", res);
              // this.syncData('image', res.files[0]);
              this.isFirst = false;
              return true;
            }, (err) => {
              return false;
              console.log("the err is the ==========>", err);
            })
            // adding last log into localStorage it will helps to calculate difference, next stopped time
            await localStorage.setItem('logs', JSON.stringify(logs));
            console.log("at the time of stop", logs);
            await this._userService.storeLogs(logs).subscribe(res => console.log(res), err => console.log(err));
            await this.getLogs();
            this.loading = false;
            $("#start").removeClass('disable');
            console.log("loading",this.loading)
          }
        }
      });
    }, 2000);

    await clearInterval(this.intervalId);
  }

  async start() {
    console.log("start, !this.running ==>", !this.running);
    // on click to start enable button and start timer and screenshots capturing
    if (!this.running) {
      this.timer();
      $("#start").addClass('disable');
      $("#stop").removeClass('disable');
      this.running = true;
      localStorage.setItem('isRunning', JSON.stringify(this.running));
      this.startCapturing();
    }
    // on start, after 2 second, read json file
    await setTimeout(() => {
      this.fs.readFile(this.jsonFilePath, async (err, data) => {
        console.log("start data=====>", data);
        console.log(JSON.parse(data));
        if (err) {
          return false
          console.log("error", err);
        }
        else {
          console.log(JSON.parse(data));
          const userLogDetails = JSON.parse(data);

          /*Check for lastest version*/
          if (!userLogDetails.isLatestVersion) {
            let details = await this.appendFilesToJson(userLogDetails);
            details.append('jsonData', JSON.stringify(userLogDetails));
            details.append('userId', this.userInfo._id);
            console.log(userLogDetails, details);
            await this._userService.uploadbase64Img(details).subscribe((res) => {
              console.log("the res is the ==========>", res);
              // this.syncData('image', res.files[0]);
              this.isFirst = false;
              return true;
            }, (err) => {
              return false;
              console.log("the err is the ==========>", err);
            })
          }
        }
      });
    }, 2000);
  }

  // on logout clear global variable default to 0
  clear() {
    console.log("clear")
    this.seconds = 0;
    this.minutes = 0;
    this.running = false;
    localStorage.setItem('isRunning', JSON.stringify(this.running));
    clearInterval(this.intervalId);
  }

  /**
   * on start and stop syncData calls
   */
  async syncData(flag, logTime?) {
    console.group("syncData");
    console.log("Flag ==>", flag);
    console.log("this.jsonFilePath", this.jsonFilePath)
    if (this.fs.existsSync(this.jsonFilePath)) {
      console.log("Files exitssss");
      await this.fs.readFile(this.jsonFilePath, async (err, data) => {
        console.log("data====>", data);
        if (err) console.log("error", err);
        else {
          console.log("JSON Parse inside syncData", JSON.parse(data));
          this.userLogDetails = JSON.parse(data);

          console.log("Data", data.toString('utf-8'));
          console.log("Data as userLogDetails", this.userLogDetails);
          console.log("logTime", logTime);
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

  /**
   * updateRecordFile called from syncData on start and stop
   * it gets flag start stop and write current time log and inactivity status into json file
   */
  async updateRecordFile(flag, userLogDetails, logTime?) {
    console.group("updateRecordFile");
    console.log("flag==>", flag, "userLogDetaiils===>", userLogDetails, "logTime==>" + logTime);

    let lastAttendanceLog = userLogDetails.attendance[userLogDetails.attendance.length - 1];
    console.log("lastAttendanceLog", lastAttendanceLog)

    // if user timelog doesn't match with current log or not time log of current day, set default values
    if ((!lastAttendanceLog) || (lastAttendanceLog.date != this.currentDate)) {
      userLogDetails.attendance.push({
        date: this.currentDate,
        timeLog: [],
        difference: '-',
        inActivityTime: 0,
        images: []
      });
      console.log("userLogDetails", userLogDetails);
    }
    // if system found last attendance
    lastAttendanceLog = userLogDetails.attendance[userLogDetails.attendance.length - 1];
    console.log("lastAttendanceLog", lastAttendanceLog)
    const previousInActivityTime = lastAttendanceLog.inActivityTime;
    console.log("previousInActivityTime", previousInActivityTime)
    // var previousInActivityTime = JSON.parse(localStorage.getItem("currentUser"));
    // previousInActivityTime.flag = flag;
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
        await this.fs.writeFileSync(this.jsonFilePath, JSON.stringify(userLogDetails));
        break;

      case "stop":
        clearInterval(this.inActivityTimeInterval);
        let lastTimeLogObject = lastAttendanceLog.timeLog[lastAttendanceLog.timeLog.length - 1];
        console.log("lastAttendanceLog", lastTimeLogObject);
        lastTimeLogObject.out = logTime;
        lastAttendanceLog = await this.calculateDifference(lastAttendanceLog)
        await this.fs.writeFileSync(this.jsonFilePath, JSON.stringify(userLogDetails));
        break;

      case "image":
        lastAttendanceLog.images.push({ path: logTime });
        await this.fs.writeFileSync(this.jsonFilePath, JSON.stringify(userLogDetails));
        break;
      case "resumeTime":
        this.inActivityTimeInterval = setInterval(async () => {
          await this.calculateInactivityTime(userLogDetails, previousInActivityTime);
        }, 1000);
        await this.fs.writeFileSync(this.jsonFilePath, JSON.stringify(userLogDetails));
        break;
      default:
        // code...
        await this.fs.writeFileSync(this.jsonFilePath, JSON.stringify(userLogDetails));
        break;
    }

    console.log("userLogDetails before writing in to json file path ==>", userLogDetails);
    userLogDetails.isLatestVersion = false;
    localStorage.setItem("isLatestVersion", "false");
    // await this.fs.writeFileSync(this.jsonFilePath, JSON.stringify(userLogDetails));
    // localStorage.setItem("currentUser",JSON.stringify(userLogDetails))
    return;



    console.groupEnd();
  }


  calculateDifference(currentAttendanceLog) {
    console.group('calculateDifference', currentAttendanceLog);

    var in1 = currentAttendanceLog.timeLog[currentAttendanceLog.timeLog.length - 1].in;
    var out = currentAttendanceLog.timeLog[currentAttendanceLog.timeLog.length - 1].out;
    var inn = moment(in1, 'hh:mm:ss: a').diff(moment().startOf('day'), 'seconds');
    var outt = moment(out, 'hh:mm:ss: a').diff(moment().startOf('day'), 'seconds');

    console.log("in1", in1, "out", out, "inn", inn, "outt", out)
    let seconds = outt - inn;
    console.log("seconds", seconds);
    // console.log("startlogs", JSON.parse(localStorage.getItem("startLogs")).time.seconds)
    console.log("this.diff before if", this.diff)
    console.log("diff local storage", localStorage.getItem("diff"))

    // if past log have difference time then it will go inside add that difference + current/recent log seconds
    if (localStorage.getItem("diff") && localStorage.getItem("diff") != "-") {
      console.log("this.diff inside if", this.diff)
      console.log("inside if calculate difference")

      var difference = moment(currentAttendanceLog.difference, 'hh:mm:ss: a').diff(moment().startOf('day'), 'seconds');

      console.log("difference", difference)

      seconds = seconds + difference;

      console.log("seconds++++++", seconds)
    }

    seconds = Number(seconds);

    console.log("outer seconds", seconds)

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

  // calculate inactivity time
  calculateInactivityTime(userLogDetails, previousInActivityTime) {
    console.log("Calculate Inactivity Time")

    let lastAttendanceLog = userLogDetails.attendance[userLogDetails.attendance.length - 1];

    /* when no activity found, user goes in idle mode, it will add inactivity time, save it into json file */
    if (!remote.powerMonitor.getSystemIdleTime() && this.inActivityStatus == 'idle') {
      console.log("In if part and lastAttendance:", lastAttendanceLog);

      lastAttendanceLog.inActivityTime = lastAttendanceLog.inActivityTime + this.inActivityTime;

      console.log("userLogDetails ==..==>", userLogDetails);

      this.inActivityStatus = 'active'

      userLogDetails.isLatestVersion = false;

      localStorage.setItem("isLatestVersion", "false");

      console.log("userLogDetails before writing inactivitytime into json file", userLogDetails)

      this.fs.writeFileSync(this.jsonFilePath, JSON.stringify(userLogDetails));

    }
    else if (remote.powerMonitor.getSystemIdleState(5) == 'idle') {
      // console.log("In else if part");
      this.inActivityStatus = 'idle'

      this.inActivityTime = remote.powerMonitor.getSystemIdleTime();
    }
    else {
      // console.log("In else part");
      console.log("++++ else part of claculateInactivity----")
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
          console.log("userLogDetails===++++", userLogDetails)
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
    console.log("inside appendfiles to json+++++++")
    const formData = new FormData();
    // formData.append('userLogDetails',JSON.stringify(userLogDetails));            
    this.userLogDetails = JSON.parse(localStorage.getItem("currentUser"));
    _.forEach(userLogDetails.attendance[userLogDetails.attendance.length - 1], (singleAttendance, logIndex) => {
      console.log("singleAttendance++++", singleAttendance);
      _.forEach(singleAttendance.images, async (singleImage, imageIndex) => {
        console.log("singleImage+++++", singleImage);
        const contents = this.fs.readFileSync(singleImage.path, { encoding: 'base64' });
        console.log("contents+++++++", contents)

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
    console.log("userLogDetails++++++++", userLogDetails)
    formData.append('userLogDetails', JSON.stringify(userLogDetails));
    console.log("formData:++++++", formData)

    return formData;
  }

  /*Check online offline status of user*/
  checkStatus(status) {
    console.log("checkStatus")
    console.log(navigator.onLine);
    const object = {
      status,
      user: this.userInfo._id,
      userName: this.userInfo.name
    }
    this._userService.changeStatus(object)
  }


  removeDataFromJsonFile(res) {
    console.log("Remove Data from json file")
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
    console.log("checkLastLog")
  }

  ch(e) { }

}


