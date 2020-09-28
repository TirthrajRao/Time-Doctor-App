function externalFunction() {
	const path = require("path");
  var fs = require('fs');
  const {desktopCapturer} = require('electron');
  
      fullscreenScreenshot(function(base64data){
                  localStorage.setItem('imgUrl', JSON.stringify(base64data));
        // document.getElementById("mypreview").setAttribute("src", base64data);
      },'image/png');
  
    function fullscreenScreenshot(callback, imageFormat) {
      var _this = this;
      this.callback = callback;
      imageFormat = imageFormat || 'image/jpeg';
      console.log("imageFormat is the ============>", imageFormat)
      this.handleStream = (stream) => {
        console.log('the stream is =====>', stream);
        var video = document.createElement('video');
        video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';

        video.onloadedmetadata = function () {
          video.style.height = this.videoHeight + 'px'; 
          video.style.width = this.videoWidth + 'px'; 

          video.play();

          var canvas = document.createElement('canvas');
          canvas.id = "canvas";
          canvas.width = this.videoWidth;
          canvas.height = this.videoHeight;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const dataUrl = canvas.toDataURL();
          var image = new Image();
          image.src = canvas.toDataURL();
          console.log("the content is the =========>", image);

          if (_this.callback) {
            _this.callback(canvas.toDataURL(imageFormat));
            console.log("the canvas is the ========>", canvas);

          } else {
            console.log('Need callback!');
          }


           video.remove();
          try {
            stream.getTracks()[0].stop();
          } catch (e) {}
        }

        video.srcObject = stream;
        document.body.appendChild(video);
      };

      this.handleError = function(e) {
        console.log(e);
      };

      desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
        console.log(sources);


        for (const source of sources) {
          if ((source.name === "Entire Screen") || (source.name === "Screen 1") || (source.name === "Screen 2")) {
            try{
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: source.id,
                    minWidth: 1280,
                    maxWidth: 4000,
                    minHeight: 720,
                    maxHeight: 4000
                  }
                }
              });
              console.log("the stream is the =======>", stream)
              _this.handleStream(stream);
            } catch (e) {
              console.log("the e is the =======>", e)
              _this.handleError(e);
            }
          }
        }
      });
    }
  }



  // function externalFunction() {
//   const path = require("path");
//   var fs = require('fs');
//   const {desktopCapturer} = require('electron');
  
//       fullscreenScreenshot(function(base64data){

//         document.getElementById("my-preview").setAttribute("src", base64data);
//       },'image/png');

//     function fullscreenScreenshot(callback, imageFormat) {
//       var _this = this;
//       this.callback = callback;
//       imageFormat = imageFormat || 'image/jpeg';
//       console.log("imageFormat is the ============>", imageFormat)
//       this.handleStream = (stream) => {
//         console.log('the stream is =====>', stream);
//         var video = document.createElement('video');
//         video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';

//         video.onloadedmetadata = function () {
//           video.style.height = this.videoHeight + 'px'; 
//           video.style.width = this.videoWidth + 'px'; 

//           video.play();

//           var canvas = document.createElement('canvas');
//           canvas.id = "canvas";
//           canvas.width = this.videoWidth;
//           canvas.height = this.videoHeight;
//           var ctx = canvas.getContext('2d');
//           ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//           const dataUrl = canvas.toDataURL();
//           const content = dataUrl.substring('data:image/png;base64,'.length);
//           // console.log("the content is the =========>", content);

//           canvas.toBlob(function(blob) {
//             saveAs(blob, "image.png");
//           });

//           if (_this.callback) {
//             _this.callback(canvas.toDataURL(imageFormat));
//             console.log("the canvas is the ========>", canvas);

//           } else {
//             console.log('Need callback!');
//           }


//           video.remove();
//           try {
//             stream.getTracks()[0].stop();
//           } catch (e) {}
//         }

//         video.srcObject = stream;
//         document.body.appendChild(video);
//       };

//       this.handleError = function(e) {
//         console.log(e);
//       };

//       desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
//         console.log(sources);


//         for (const source of sources) {
//           if ((source.name === "Entire Screen") || (source.name === "Screen 1") || (source.name === "Screen 2")) {
//             try{
//               const stream = await navigator.mediaDevices.getUserMedia({
//                 audio: false,
//                 video: {
//                   mandatory: {
//                     chromeMediaSource: 'desktop',
//                     chromeMediaSourceId: source.id,
//                     minWidth: 1280,
//                     maxWidth: 4000,
//                     minHeight: 720,
//                     maxHeight: 4000
//                   }
//                 }
//               });
//               console.log("the stream is the =======>", stream)
//               _this.handleStream(stream);
//             } catch (e) {
//               console.log("the e is the =======>", e)
//               _this.handleError(e);
//             }
//           }
//         }
//       });
//     }
//   }