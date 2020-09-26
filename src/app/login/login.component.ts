import { Component, OnInit } from '@angular/core';
import {FormControl, Validators, FormGroup, FormBuilder} from '@angular/forms';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
	loginForm: FormGroup;
	isError : boolean = false;
	isDisable:boolean =false;
	errorMessage : any;

	constructor(public _userService: UserService, private router: Router) { 
		this.loginForm = new FormGroup({
			email: new FormControl('', Validators.required),
			password: new FormControl('',Validators.required)
		});
	}

	ngOnInit() {
	}

	loginUser(value){
		this._userService.loginUser(value).subscribe((response) => {
			console.log("successfull login"  , response);
			this.isDisable = false;
			this.isError = false;
			localStorage.setItem('currentUser', JSON.stringify(response));
			this.router.navigate(['home']);
		},(err) => {
			console.log(err.status);
			if(err.status == 400){
				this.errorMessage = "Please Check your Email/Password";
			}
			this.isError = true;
			console.log("err in login " , err);
		})
		console.log(value);
		this.loginForm.reset();
	}

}
