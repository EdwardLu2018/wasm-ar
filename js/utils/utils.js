export class Utils {
    static isMobile () {
        return /Android|mobile|iPad|iPhone/i.test(navigator.userAgent);
    }

    static round3(num) {
        return Math.round((num + Number.EPSILON) * 1000) / 1000;
    }
}
