import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { config } from '../config';
import { of, pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import * as moment from 'moment';
declare var require: any;


@Injectable({
	providedIn: 'root'
})
export class UserService {
	isLoggedIn: EventEmitter<any> = new EventEmitter<any>();

	private currentUserSubject: BehaviorSubject<any>;
	public currentUser: Observable<any>;
	constructor(public _http: HttpClient) {
		this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('currentUser')));
		this.currentUser = this.currentUserSubject.asObservable();
	}

	getdata() {
		return this._http.get(config.baseApiUrl + "getData");
	}

	public get currentUserValue(): any {
		return this.currentUserSubject.value;
	}

	loginUser(body) {
		return this._http.post(config.baseApiUrl + "user/login", body).pipe(
			map(user => {
				console.log("login user=========>", user);
				if (user) {
					localStorage.setItem('currentUser', JSON.stringify(user));
					this.isLoggedIn.emit('loggedIn');
					this.currentUserSubject.next(user);
				}
				return user;
			})
		);
	}

	signup(value) {
		console.log("the value in service is ====>", value);
		return this._http.post(config.baseApiUrl + "user/sign-up", value);
	}

	uploadImg(formData) {
		return this._http.post<any>(config.baseApiUrl + 'uploadfile', formData);
	}


	uploadbase64Img(data) {
		console.log(data)
		return this._http.post<any>(config.baseApiUrl + "user/uploadImage", data);
	}

	uploadImage(value) {
		console.log("the value of -----------", value);
		return this._http.post(config.baseApiUrl + 'projects/addPost', value);
	}

	getLogs() {
		const data = { user: JSON.parse(localStorage.getItem('currentUser'))._id, date: moment().format('DD-MM-yyyy') };
		return this._http.post(config.baseApiUrl + 'user/get-log', data);
	}

	storeLogs(logs) {
		logs.user = JSON.parse(localStorage.getItem('currentUser'))._id;
		return this._http.post(config.baseApiUrl + 'user/add-logs', logs);
	}

	updateLogs(logs){
		logs["password"] = JSON.parse(localStorage.getItem('currentUser')).password;
		return this._http.post(config.baseApiUrl + 'user/update-logs', logs);
	}


}
