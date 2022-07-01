

export class VRMovieController {
   constructor(movie, setOffset) {
      this.startTime = null;     // Time when animation started in seconds
      this.currentOffset = 0;    // Current time into movie
      this.playing = false;
      this.duration = movie.evts[movie.evts.length - 1].time;
      this.rate = 1;
      this.setOffset = setOffset;
   }

   play(rate) {
      this.playing = true;

      // If rate changed, reset startTime
      if (this.rate !== rate) {
         this.rate = rate;
         this.startTime = null;
      }

      // If offset is past end of movie, reset
      if (this.currentOffset >= this.duration) {
         this.currentOffset = 0;
      }
   }

   pause() {
      this.playing = false;
      this.startTime = null;
   }

   animate(time) {
      if (this.playing) {
         time /= 1000;  // Convert to seconds

         // If we are starting animation, set startTime
         if (this.startTime === null) {
            this.startTime = time - this.currentOffset / this.rate;
         }

         // Stop animation at end of movie
         if (this.currentOffset > this.duration) {
            this.pause();
         }

         // Set currentOffset to reflect time into movie
         let newOffset = (time - this.startTime) * this.rate;

         // If offset changed, update scene graph
         if (newOffset !== this.currentOffset) {
            this.currentOffset = newOffset;
            this.setOffset(this.currentOffset);
         }
      }
   }
}