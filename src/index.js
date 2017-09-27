const MILLISECONDS_PER_WEEK = 604800000;
const MILLISECONDS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;
const MILES_PER_METER = 0.000621371;
const FEET_PER_METER = 3.28084;

let Humanize = require('humanize-plus');

const Months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const isInCurrentMonth = (date) => {
    const currentMonth = new Date().getMonth();
    const activityMonth = new Date(Date.parse(date)).getMonth();
    return (currentMonth === activityMonth) ? true : false;
}

const Filters = {
    currentMonthlyDistanceOfType: (type) => (activity) => {
        return (
            isInCurrentMonth(activity.start_date_local) 
            && activity.type === type
            && activity.distance > 0
        );
    },

    currentMonthlyBikingDistance: (activity) => {
        return (
            isInCurrentMonth(activity.start_date_local) 
            && activity.type === 'Ride'
            && activity.distance > 0
        );
    },

    currentMonthlyRunningDistance: (activity) => {
        return (
            isInCurrentMonth(activity.start_date_local) 
            && activity.type === 'Run'
            && activity.distance > 0
        );
    }

}

// not being used.
const ActivityAccumulator = (a, b) => {
    return {
        average_cadence: (a.average_cadence + b.average_cadence) / 2.0,
        average_speed: (a.average_speed + b.average_speed) / 2.0,
        average_watts: (a.average_watts + b.average_watts) / 2.0,
        comment_count: a.comment_count + b.comment_count,
        distance: a.distance + b.distance,
        elapsed_time: a.elapsed_time + b.elapsed_time,
        elev_high: Math.max(a.elev_high, b.elev_high),
        elev_low: Math.min(a.elev_low, b.elev_low),
        elev_over_distance: (a.total_elevation_gain + b.total_elevation_gain)/(a.distance + b.distance),
        kilojoules: a.kilojoules + b.kilojoules,
        kudos_count: a.kudos_count + b.kudos_count,
        max_speed: Math.max(a.max_speed, b.max_speed),
        moving_time: a.moving_time + b.moving_time,
        photo_count: a.photo_count + b.photo_count,
        pr_count: a.pr_count + b.pr_count,
        total_elevation_gain: a.total_elevation_gain + b.total_elevation_gain,
        total_photo_count: a.total_photo_count + b.total_photo_count,
    };
}

const Sorts = {
    sortByDistanceHighToLow: (a, b) => {
        if (a.distance < b.distance)
            return 1;
        if (a.distance > b.distance)
            return -1;
        return 0;
    },

    sortByKudosCountHighToLow: (a, b) => {
        if (a.kudos_count < b.kudos_count)
            return 1;
        if (a.kudos_count > b.kudos_count)
            return -1;
        return 0;
    },

    sortByElevOverMileage: (a, b) => {
        if (a.elev_over_distance < b.elev_over_distance)
            return 1;
        if (a.elev_over_distance > b.elev_over_distance)
            return -1;
        return 0;
    }
}

// filter, reduce, accumulate, and sort
const getLeaderboard = (activities, filter, sort) => {
    const filteredActivities = activities.filter(filter);

    let activitiesByUser = filteredActivities.reduce((users, activity) => {
        const id = activity.athlete.id;
        if (!users[id]) {
            users[id] = {};
            users[id].athlete = activity.athlete;
            users[id].activities = [ activity ];
            return users;
        }

        users[id].activities.push(activity);
        return users;
    }, {});

    

    let users = [];
    for (const id in activitiesByUser) {
        users.push(id);
    }

    let leaderboard = users.map((id) => {

        const athlete = activitiesByUser[id].athlete;

        let distance = 0;
        let kudos_count = 0;
        let total_elevation_gain = 0;
        activitiesByUser[id].activities.forEach((activity) => {
            distance += activity.distance;
            kudos_count += activity.kudos_count;
            total_elevation_gain += activity.total_elevation_gain;
        });

        return {
            athlete,
            distance,
            kudos_count,
            total_elevation_gain
        }
    });

    leaderboard.sort(sort);

    leaderboard.forEach((entry) => {
        entry.distanceInMilesText = `${Humanize.formatNumber(entry.distance * MILES_PER_METER, 2)}`;
        entry.elevationInFeetText = `${Humanize.formatNumber(entry.total_elevation_gain * FEET_PER_METER, 2)}`;
        entry.elevationOverDistanceText = `${Humanize.formatNumber((entry.total_elevation_gain / entry.distance) * FEET_PER_METER/MILES_PER_METER, 2)}`;
        entry.distanceInMiles = entry.distance * MILES_PER_METER;
        entry.elevationInFeet = entry.total_elevation_gain * FEET_PER_METER;
        entry.elevationOverDistance = (entry.total_elevation_gain / entry.distance) * FEET_PER_METER/MILES_PER_METER;
    });

    return leaderboard;
};

module.exports = {
    Filters,
    Sorts,
    getLeaderboard 
}
