const RIDE_STATUS = {
    Finding: 'FINDING',
    Picking: 'PICKING',
    Riding: 'RIDING',
    Canceled: 'CANCELED',
    Completed: 'COMPLETED',
}

const DRIVER_STATUS = {
    Pending: 'PENDING',
    Ready: 'READY',
    Riding: 'RIDING',
    Inactive: 'INACTIVE',
}

const USER_STATUS = {
    Waiting: 'WAITING',
    Riding: 'RIDING',
    NoRide: 'NO-RIDE',
}

module.exports = {
    RIDE_STATUS,
    DRIVER_STATUS,
    USER_STATUS
}