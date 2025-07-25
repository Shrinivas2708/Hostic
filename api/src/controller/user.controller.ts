import { NextFunction, Request, Response } from "express";
import { User } from "../model/User.model";

export const getUser = async (req:Request,res:Response,next:NextFunction)=>{
    const user_id = req.id;
    try {
        const user = await User.findById(user_id);
        res.status(200).json({
        user
    })
    } catch (error) {
        next(error)
    }
    
}