function timeAgo(unixTimestamp) {
    const now = (new Date()).getTime();
    const secondsPast = Math.floor((now - unixTimestamp) / 1000);

    if (secondsPast < 60) {
        return `${secondsPast} seconds ago`;
    } else if (secondsPast < 3600) {
        const minutes = Math.floor(secondsPast / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (secondsPast < 86400) {
        const hours = Math.floor(secondsPast / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        const days = Math.floor(secondsPast / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
}

export default timeAgo;
