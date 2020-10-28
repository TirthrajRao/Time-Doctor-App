import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { remote, dialog} from 'electron';
import * as moment from 'moment';


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

	fs:any;
	currentDate:any = moment().format('DD-MM-yyyy');
	constructor(public _userService: UserService, private router: Router) {
		this.fs = (window as any).fs;

		this.loginForm = new FormGroup({
			email: new FormControl('', Validators.required),
			password: new FormControl('', Validators.required)
		});
	}

	ngOnInit() {
					
			console.log("user path ===>", remote.app.getPath("userData"));
			console.log("app path ===>", remote.app.getPath("appData"));
		
	}

	loginUser(value) {
		this._userService.loginUser(value).subscribe((response) => {
			console.log("successfull login", response);
			this.generateLoggedInUserFile(response)
			this.isDisable = false;
			this.isError = false;
			localStorage.setItem('currentUser', JSON.stringify(response));
			this.router.navigate(['home']);
		}, (err) => {
			console.log(err.status);
			if (err.status == 400 || err.status == 401) {
				this.errorMessage = "Please Check your Email/Password";
			}
			this.isError = true;
			console.log("err in login ", err);
		})
		console.log(value);
		this.loginForm.reset();
	}

	generateLoggedInUserFile(response){
		let data = {
			Pushpraj: "Name"
		}
		

		console.log("Hey");
		if (this.fs.existsSync(remote.app.getPath("userData")+"/"+response._id+".json")) {
			console.log("Files exitssss");
			this.checkForTodaysLog(response);

		}
		else{
			console.log("File does not exist");
			this.fs.chmod(remote.app.getPath("userData")+"/"+response._id+".json", this.fs.constants.S_IRUSR | this.fs.constants.S_IWUSR, () => { 
				console.log("Trying to write to file"); 
				console.log("\nReading the file contents"); 


				this.addRecordToFile(response);
				
				// this.fs.writeFileSync(remote.app.getPath("userData")+"/"+response._id+".json",JSON.stringify(data));
			});
		}
	}


	async addRecordToFile(userDetails, existingRecord?){
		console.log("userDetails ===>", userDetails, existingRecord);
		let objToSave:any = {};

		if(!existingRecord){
			objToSave = {
				attendance: [{
					date: this.currentDate,
					timeLog: []
				}],
				email: userDetails.email,
				name: userDetails.name,
				userRole: userDetails.userRole,
				versionId: userDetails.versionId
			}
		}
		else{
			objToSave = existingRecord;
			objToSave.attendance.push({
				date: this.currentDate,
			});

		}

		this.fs.writeFileSync(remote.app.getPath("userData")+"/"+userDetails._id+".json",JSON.stringify(objToSave));
	}


	checkForTodaysLog(userDetails){
		this.fs.readFile(remote.app.getPath("userData")+"/"+userDetails._id+".json", (err, data) => {

			if (err) console.log("error", err);
			else {

				const logDetails = JSON.parse(data);

				console.log("logDetails ===>", logDetails);
				if(logDetails.attendance[logDetails.attendance.length -1 ].date == this.currentDate){
					console.log("Same date.");
				}else{

					this.addRecordToFile(userDetails, logDetails);
					console.log("Different date");
				}


			} 

		});
	}

}
