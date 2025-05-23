import { Request, Response } from 'express';
import Booking from '../models/Booking';
import { RoomType } from '../../../shared/types';
import Room from '../models/Room';
import Hotel from '../models/Hotel';

//Function to check availability of room
type CheckAvailabilityProps = {
  room: string; // or mongoose.Types.ObjectId
  checkInDate: Date;
  checkOutDate: Date;
};
const checkAvailability = async ({
  room,
  checkInDate,
  checkOutDate,
}: CheckAvailabilityProps): Promise<boolean> => {
  try {
    const bookings = await Booking.find({
      room,
      checkInDate: { $lte: checkOutDate },
      checkOutDate: { $gte: checkInDate },
    });
    const isAvailable = bookings.length === 0;
    return isAvailable;
  } catch (error) {
    console.log((error as Error).message);
    return false;
  }
};

// Api to check availibiility of room
export const checkAvailabilityAPI = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });
    if (!isAvailable) {
      return res.json({ success: false, message: 'Room not available' });
    }
    res.json({ success: true, isAvailable });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

//Api to create new booking
export const createBooking = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { room, checkInDate, checkOutDate, guests } = req.body;
    const user = req.user._id;
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });
    if (!isAvailable) {
      return res.json({ success: false, message: 'Room not available' });
    }

    //Get total price for room
    const roomData = await Room.findById(room).populate('hotel');
    if (!roomData) {
      return res.json({ success: false, message: 'Room not found!' });
    }
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const totalPrice = roomData.pricePerNight * nights;

    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: +guests,
      checkInDate,
      checkOutDate,
      totalPrice,
    });

    res.json({ success: true, message: 'Booking created successfully!' });
  } catch (error) {
    res.json({
      success: false,
      message: 'Failed to create booking' + (error as Error).message,
    });
  }
};

//Api to get all bookings for a user
export const getUserBookings = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const user = req.user._id;
    const bookings = await Booking.find({ user })
      .populate('room hotel')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.json({
      success: false,
      message: 'Failed to fetch user bookings' + (error as Error).message,
    });
  }
};

export const getHotelBookings = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const hotel = await Hotel.findOne({ owner: req.auth.userId });
    if (!hotel) {
      return res.json({ success: false, message: 'No hotel found' });
    }
    const bookings = await Booking.find({ hotel: hotel._id })
      .populate('room hotel user')
      .sort({ createdAt: -1 });

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (acc, booking) => acc + booking.totalPrice,
      0
    );
    res.json({
      success: true,
      dashboardData: { totalBookings, totalRevenue, bookings },
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Failed to fetch hotel bookings' + (error as Error).message,
    });
  }
};
