type Task = Readonly<{
  id: string;
  taskname: string;
  sector: string;
  begin: Date;
  end: Date;
  duration: number;
  done: boolean;
}>;

class Interface {
  name: string;
  log: Task[];
  display: Display;

  constructor() {
    this.name = "quantified-life";
    this.log = this.revive(localStorage.getItem(this.name)) || [];
  }

  connect(display: Display) {
    this.display = display;
  }

  listen(input: string) {
    input = input.trim();
    if (input.startsWith("start")) {
      let data = input.slice(5).split(",");
      this.start(data[0].trim(), data[1].trim());
    }
    if (input.startsWith("stop")) {
      this.stop();
    }
    if (input.startsWith("add")) {
      let data = input.split(",");
      this.addTask(
        data[0].trim(),
        data[1].trim(),
        Number(data[2].trim()),
        Number(data[3].trim())
      );
    }
    if (input.startsWith("delete")) {
      let data = input.slice(6).split(",");
      data.forEach((id) => {
        this.delete(id.trim());
      });
    }
    if (input.startsWith("delete all")) {
      this.log.forEach((task) => {
        this.delete(task.id.trim());
      });
    }
    if (input.startsWith("export")) {
      this.export();
    }
  }

  start(taskname: string, sector: string) {
    if (!this.active()) {
      const task: Task = {
        id: randID(5),
        taskname: taskname,
        sector: sector,
        begin: new Date(),
        end: new Date(),
        duration: 0,
        done: false,
      };
      this.update(task);
    }
  }

  stop() {
    if (this.active()) {
      let task = Object.assign(this.getNotDone());
      this.delete(task.id);
      task.end = new Date();
      task.duration = task.end - task.begin;
      task.done = true;
      this.update(task);
    }
  }

  addTask(taskname: string, sector: string, begin: number, end: number) {
    this.update({
      id: randID(5),
      taskname: taskname,
      sector: sector,
      begin: new Date(begin),
      end: new Date(end),
      duration: end - begin,
      done: true,
    });
  }

  delete(id: string) {
    this.log = this.log.filter((task) => task.id != id);
    this.updateLog();
  }

  update(task: Task) {
    this.log.push(task);
    this.updateLog();
    this.display.updateCircle();
  }

  updateLog() {
    if (this.log != undefined && this.log != []) {
      localStorage.setItem(this.name, this.stringify());
    }
  }

  active(): boolean {
    for (let i = 0; i < this.log.length; i++) {
      if (this.log[i].done == false) {
        return true;
      }
    }
    return false;
  }

  getNotDone(): Task {
    for (let i = 0; i < this.log.length; i++) {
      if (this.log[i].done == false) {
        return this.log[i];
      }
    }
  }

  revive(jsonString: string): [] {
    return JSON.parse(jsonString, function (key, value) {
      if (key == "begin" || key == "end") return new Date(value);
      return value;
    });
  }

  stringify() {
    return JSON.stringify(this.log);
  }

  gettasks(days: number) {
    let lowerLimit = new Date(new Date().setHours(0, 0, 0) - days * 86400000);
    return this.log.filter((task) => task.begin >= lowerLimit);
  }

  export() {
    let filename = `qt-export-${dateToYMD(new Date())}.txt`;
    const blob = new Blob([this.stringify()], { type: "text/json" });
    const link = document.createElement("a");

    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/json", link.download, link.href].join(
      ":"
    );

    const event = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(event);
    link.remove();
  }
}

function randID(length): string {
  return [...Array(length)]
    .map((_) => ((Math.random() * 36) | 0).toString(36))
    .join(``)
    .toUpperCase();
}

function dateToYMD(date: Date): string {
  var strArray = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  var d = date.getDate();
  var m = strArray[date.getMonth()];
  var y = date.getFullYear();
  return "" + (d <= 9 ? "0" + d : d) + "-" + m + "-" + y;
}

class Display {
  interface: Interface;
  body: HTMLElement;
  input: HTMLElement;
  command: HTMLElement;
  quant: HTMLElement;
  circle: HTMLElement;

  constructor(inter: Interface) {
    this.interface = inter;
    this.body = document.body;
    this.quant = this.createElement("div");
    this.quant.setAttribute("id", "quantified");
    this.quant.setAttribute("tabindex", "0");
    this.circle = this.createElement("span");
    this.circle.setAttribute("id", "circle");
    this.input = this.createElement("input");
    this.input.setAttribute("id", "command");
    this.input.setAttribute("type", "text");
    this.input.setAttribute("placeholder", "Track what you doing");
    this.input.setAttribute("spellcheck", "false");
    this.quant.append(this.circle);
    this.quant.append(this.input);
    this.body.append(this.quant);
    this.command = document.getElementById("command");
    this.command.addEventListener("keydown", ({ key }) => {
      if (key === "Enter") {
        this.interface.listen((<HTMLInputElement>this.command).value);
        (<HTMLInputElement>this.command).value = "";
      }
    });
    this.updateCircle();
  }

  updateCircle() {
    if (this.interface.active()) {
      this.circle.setAttribute("class", "change-opacity");
      this.input.setAttribute("placeholder", "Lemme know when you are done");
    } else {
      this.circle.removeAttribute("class");
      this.input.setAttribute("placeholder", "Track what you doing");
    }
  }

  createElement(tag: string, className?: string): HTMLElement {
    const element = document.createElement(tag);
    if (className) element.classList.add(className);

    return element;
  }

  // Retrieve an element from the DOM
  getElement(selector: string) {
    const element = document.querySelector(selector);

    return element;
  }
}

let quantified1 = new Interface();
let display = new Display(quantified1);
quantified1.connect(display);
