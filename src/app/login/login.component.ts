import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { remote, dialog} from 'electron';

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

	constructor(public _userService: UserService, private router: Router) {
		this.fs = (window as any).fs;

		this.loginForm = new FormGroup({
			email: new FormControl('', Validators.required),
			password: new FormControl('', Validators.required)
		});
	}

	ngOnInit() {
					
		
		
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
		if (this.fs.existsSync(remote.app.getAppPath()+"/"+response._id+".json")) {
			console.log("Files exitssss");
			this.fs.readFile(remote.app.getAppPath()+"/"+response._id+".json", (err, data) => {

				if (err) console.log("error", err);
				else {
					console.log(JSON.parse(data));
					console.log("Data",data.toString('utf-8'));
				} 

			});
		}
		else{
			console.log("File does not exist");
			this.fs.chmod(remote.app.getAppPath()+"/"+response._id+".json", this.fs.constants.S_IRUSR | this.fs.constants.S_IWUSR, () => { 
				console.log("Trying to write to file"); 
				console.log("\nReading the file contents"); 
				this.fs.writeFileSync(remote.app.getAppPath()+"/"+response._id+".json",JSON.stringify(data));
			});
		}
	}

}
