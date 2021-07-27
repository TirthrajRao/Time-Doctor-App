import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { UserService } from './services/user.service';
import { Router } from '@angular/router';
import { remote } from 'electron';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Rao Doctor';
  intervalId: any;
  userInfo = JSON.parse(localStorage.getItem('currentUser'));

  constructor(public _userService: UserService, public router: Router) {
    console.log("called");
    if (this.userInfo) {
      this.router.navigate(['/home']);
    }
    else {
      this.router.navigate(['/login']);
    }

    


  }

  ngOnInit() {
    
  }


  closeWindow(){
    alert("close")
  }
}
