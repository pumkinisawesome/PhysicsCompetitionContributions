

export class VRMovieController {
   constructor(movie, setOffset) {
      this.startTime = null;
      this.currentOffset = 0;
      this.playing = false;
      this.duration = movie.evts[movie.evts.length - 1].time;
      this.rate = null;
      this.setOffset = setOffset;
   }



   play(rate) {
      console.log('play');
      this.playing = true;
      console.log('rate: ', rate);

      if (this.rate !== rate) {
         this.rate = rate;
         this.startTime = null;
      }

      if (this.currentOffset >= this.duration) {
         this.currentOffset = 0;
      }
   }

   pause() {
      console.log('pause');
      this.playing = false;
      this.startTime = null;
   }

   animate(time) {
      if (this.playing) {
         console.log('playing');
         console.log('currentOffset: ', this.currentOffset);
         time /= 1000;
         console.log('time: ', time);

         // If we are starting animation, set startTime
         if (this.startTime === null) {
            this.startTime = time - this.currentOffset / this.rate;
            console.log('starting! startTime: ', this.startTime);
         }

         // Stop animation at end of movie
         if (this.currentOffset > this.duration) {
            console.log('end of movie');
            this.pause();
         }

         // Set currentOffset to reflect time into movie
         let newOffset = (time - this.startTime) * this.rate;

         if (newOffset !== this.currentOffset) {
            this.currentOffset = newOffset;
            this.setOffset(this.currentOffset);
         }
      }
   }
}