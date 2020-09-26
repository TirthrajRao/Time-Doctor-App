import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
declare var require: any;

declare var externalFunction:any;

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

  constructor(public _userService: UserService, public router: Router) { 
  }

  ngOnInit() {
    if (this.userInfo) {
      setInterval(() => {
        localStorage.removeItem('imgUrl');
        this.callexternalfunction();
      }, 60000);

    }
    else{
      this.router.navigate(['/login']);
      console.log("not working");
    }
  }

  callexternalfunction(){
    externalFunction();

    console.log("local called");
    setTimeout(() => {
      this.base64data = JSON.parse(localStorage.getItem("imgUrl"));
      console.log("the item get is the ===>", JSON.parse(localStorage.getItem("imgUrl")));
      this.baseArray.push(this.base64data);
      console.log("the item get is the ===>", this.base64data);

      this._userService.uploadbase64Img(this.base64data).subscribe((res) => {
        console.log("the res is the ==========>", res);
      }, (err) => {
        console.log("the err is the ==========>", err);
      })
      this.baseArray.forEach((item, index) => {
        if (item == null) {
          console.log("array null");
        }
        else{
          document.getElementById(index).setAttribute("src", this.base64data);
        }
      });
      console.log("the baseArray is the ====>", this.baseArray);
    }, 500)
  }

  logout(){
    localStorage.removeItem('currentUser');
    localStorage.removeItem('imgUrl');
    // clearInterval(this.intervalId);
    this.router.navigate(['login']);
  }

}
