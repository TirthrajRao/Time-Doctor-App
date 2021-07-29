import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { remote, dialog } from 'electron';
import * as moment from 'moment';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import Swal from 'sweetalert2'

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
	loginForm: FormGroup;
	isError: boolean = false;
	isDisable: boolean = false;
	errorMessage: any;
	timeString: any;

	fs: any;
	jsonFilePath: any;
	currentDate: any = new Date().toISOString().split("T")[0] + "T18:30:00.000Z";
	constructor(public _userService: UserService,
		private router: Router,
		private _socket: Socket) {
		this.fs = (window as any).fs;

		this.loginForm = new FormGroup({
			email: new FormControl('', Validators.required),
			password: new FormControl('', Validators.required)
		});

		remote.getCurrentWindow().on('close', (e) => {
			// console.log(!JSON.parse(localStorage.getItem('isRunning')) && !JSON.parse(localStorage.getItem('isHomeComponent')), !JSON.parse(localStorage.getItem('isRunning')), !JSON.parse(localStorage.getItem('isHomeComponent')));
			if (!JSON.parse(localStorage.getItem('isRunning')) && !JSON.parse(localStorage.getItem('isHomeComponent'))) {
				// console.log("In login", remote.getCurrentWindow());
				remote.app.exit(0);
			}
		});
	}

	ngOnInit() {
		localStorage.setItem("isHomeComponent", "false");
		// console.log("user path ===>", remote.app.getPath("userData"));
		// console.log("app path ===>", remote.app.getPath("appData"));
		// console.log("remote", remote.powerMonitor.getSystemIdleTime())
	}

	loginUser(value) {
		// console.log("loginUser")
		// console.log(navigator.onLine);

		if (navigator.onLine) {
			this._userService.loginUser(value).subscribe((response) => {
				// remote.app.removeListener()

				// console.log("successfull login", response);
				// console.log("successfull login", response);
				// console.log("response", JSON.stringify(response))
				// console.log("response type", typeof(response), response['_id'])
				this.generateLoggedInUserFile(response)
				this.generateLoggedInUserFolder(response);
				this.isDisable = false;
				this.isError = false;
				localStorage.setItem('currentUser', JSON.stringify(response));
				this._socket.removeAllListeners();
				
				
				// this._socket.connect("http://localhost:3000" , {'force new connection': true});
				this.jsonFilePath = remote.app.getPath("userData") + "/" + response['_id'] + ".json";
				this.fs.writeFileSync(this.jsonFilePath, JSON.stringify(response));
				
					// console.log("checkStatus")
					// console.log(navigator.onLine);
					const object = {
					  status: "login",
					  user: response['_id'],
					  userName: response['name']
					}
					this._userService.changeStatus(object)
				  
				this.router.navigate(['home']);
				// console.log(value);
				this.loginForm.reset();
			}, (err) => {
				// console.log(err);
				if (err.status == 400 || err.status == 401) {
					this.errorMessage = "Please Check your Email/Password";
				}
				this.isError = true;
				// console.log("err in login ", err);
			})
		}
		else {
			Swal.fire(
				'The Internet?',
				'Please check your internet connection?',
				'question'
			)
			// console.log("Please check internet");
		}
	}

	generateLoggedInUserFolder(response) {
		// console.log("this.fs.existsSync(remote.app.getPath._id ==", this.fs.existsSync(remote.app.getPath("userData") + "/" + response._id));
		if (!this.fs.existsSync(remote.app.getPath("userData") + "/" + response._id)) {
			this.fs.mkdirSync(remote.app.getPath("userData") + "/" + response._id);
		}
	}


	

	generateLoggedInUserFile(response) {
		let data = {
			Pushpraj: "Name"
		}


		console.log("Hey");
		if (this.fs.existsSync(remote.app.getPath("userData") + "/" + response._id + ".json")) {
			console.log("Files exitssss");
			this.checkForTodaysLog(response);

		}
		else {
			console.log("File does not exist");
			this.fs.chmod(remote.app.getPath("userData") + "/" + response._id + ".json", this.fs.constants.S_IRUSR | this.fs.constants.S_IWUSR, () => {
				console.log("Trying to write to file");
				console.log("\nReading the file contents");

				// this.addRecordToFile(response);
				this.checkForTodaysLog(response);

				// this.fs.writeFileSync(remote.app.getPath("userData")+"/"+response._id+".json",JSON.stringify(data));
			});
		}
	}


	async addRecordToFile(userDetails, existingRecord?) {
		console.log("addRecordToFile");
		console.log("userDetails ===>", userDetails, existingRecord);
		let objToSave: any = {};

		if (!existingRecord) {
			objToSave = {
				attendance: [{
					date: this.currentDate,
					timeLog: [],
					difference: '-',
					inActivityTime: 0,
					images: []
				}],
				email: userDetails.email,
				name: userDetails.name,
				userRole: userDetails.userRole,
				versionId: userDetails.versionId,
				_id: userDetails._id
			}
		}
		else {
			objToSave = existingRecord;
			objToSave.attendance.push({
				date: this.currentDate,
				difference: '-',
				timeLog: [],
				inActivityTime: 0,
				images: []
			});

		}

		this.fs.writeFileSync(remote.app.getPath("userData") + "/" + userDetails._id + ".json", JSON.stringify(objToSave));
	}


	checkForTodaysLog(userDetails) {
		console.log("checkfortodayslog")
		this.fs.readFile(remote.app.getPath("userData") + "/" + userDetails._id + ".json", (err, data) => {

			if (err) console.log("error", err);
			else {

				const logDetails = JSON.parse(data);

				console.log("logDetails ===>", logDetails);
				if ((logDetails.attendance.length > 0) && (logDetails.attendance[logDetails.attendance.length - 1].date == this.currentDate)) {
					console.log("Same date.");
				} else {

					this.addRecordToFile(userDetails, logDetails);
					console.log("Different date");
				}


			}

		});
	}

}
