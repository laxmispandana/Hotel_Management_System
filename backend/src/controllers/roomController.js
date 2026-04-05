const roomService = require("../services/roomService");

async function listRooms(req, res, next) {
  try {
    const rooms = await roomService.listRooms(req.query);
    res.json(rooms);
  } catch (err) {
    next(err);
  }
}

async function createRoom(req, res, next) {
  try {
    const { roomNumber, type, status, pricePerNight, capacity } = req.body;
    if (!roomNumber || !type || !status || !pricePerNight || !capacity) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const room = await roomService.createRoom({
      roomNumber,
      type,
      status,
      pricePerNight,
      capacity,
    });
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
}

async function updateRoom(req, res, next) {
  try {
    const room = await roomService.updateRoom(req.params.id, req.body);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.json(room);
  } catch (err) {
    next(err);
  }
}

async function deleteRoom(req, res, next) {
  try {
    await roomService.deleteRoom(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function availability(req, res, next) {
  try {
    const { checkIn, checkOut, type } = req.query;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: "checkIn and checkOut are required" });
    }
    const rooms = await roomService.findAvailableRooms({ checkIn, checkOut, type });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  availability,
};
