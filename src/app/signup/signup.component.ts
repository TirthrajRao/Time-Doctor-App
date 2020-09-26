import { Component, OnInit } from '@angular/core';
import {FormControl, Validators, FormGroup, FormBuilder} from '@angular/forms';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-signup',
	templateUrl: './signup.component.html',
	styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
	registerForm:FormGroup;
	loginForm: FormGroup;

	constructor(public _userService: UserService, private router: Router) {
		this.registerForm = new FormGroup({
			firstName: new FormControl('', Validators.required),
			lastName: new FormControl('',Validators.required),
			email: new FormControl('', Validators.required),
			password: new FormControl('',Validators.required),
			userRole: new FormControl('', Validators.required),
		});
	}

	ngOnInit() {
	}

	signupUser(value){
		console.log("the value is ==>", value);
		this._userService.signup(value).subscribe((res) => {
			console.log("the user response is ===>", res);
			this.router.navigate(['login']);
		}, (err) => {
			console.log("the user error is====>", err);
		});
		this.registerForm.reset();
	}

}
