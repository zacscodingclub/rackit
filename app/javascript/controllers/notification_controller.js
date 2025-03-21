import { Controller } from "@hotwired/stimulus"

// Controls the behavior of notification messages
export default class extends Controller {
  static targets = ["notice", "alert"]
  
  connect() {
    // Auto-fade notifications after 5 seconds
    setTimeout(() => {
      this.fadeOut();
    }, 5000);
  }
  
  fadeOut() {
    this.element.classList.add("opacity-0", "transition-opacity", "duration-500");
    setTimeout(() => {
      this.element.remove();
    }, 500);
  }
  
  close() {
    this.fadeOut();
  }
}