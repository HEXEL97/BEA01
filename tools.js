export class Tools {

    static setCookie(name, value, days = 30) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=";
        document.cookie = name + "=" + JSON.stringify(value) + "; " + expires;
    }

    static getCookie(name) {
        const cookie = document.cookie.split('; ').map(cookie => { return { name: cookie.split('=')[0], value: cookie.split('=')[1] } }).filter(cookie => cookie.name === name)[0]
        return cookie !== undefined ? JSON.parse(cookie.value) : null
    }

    static toTime(seconds, units = [60, 60, 24]) {
        const unit = units.shift()
        let time = Math.floor(seconds % unit).toString()
        time = '0'.repeat(unit.toString().length - time.length) + time
        return (units.length > 0) ? time = Tools.toTime(Math.floor(seconds / unit), units) + ':' + time : time
    }
}