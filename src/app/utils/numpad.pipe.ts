import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numpad'
})
export class NumpadPipe implements PipeTransform {

  transform(value: any, lenght: any): any {
    var out = "";
    if (lenght) {
      var placesLength = parseInt(lenght, 10);
      var inputLength = value.toString().length;

      for (var i = 0; i < (placesLength - inputLength); i++) {
        out = '0' + out;
      }
      out = out + value;
    }
    return out;
  }

}
