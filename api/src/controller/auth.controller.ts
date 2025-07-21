import { NextFunction, Request, Response } from "express";
import { User } from "../model/User.model";
import { createToken } from "../utils/tokens";

export const signup = async (req:Request , res:Response, next:NextFunction)=>{
    const {username,email,password} = req.body;
  try {
    const usernameExists = await User.findOne({
        username
    })
    const emailExists =  await User.findOne({
        email
    })
    if(usernameExists) {
       res.status(409).json({
        message:"Username already exists!"
       })
       return
    }
    if(emailExists) {
       res.status(409).json({
        message:"email already exists!"
       })
       return
    }
      const user = await User.create({
        username,
        email,
        password,
    })
    const token = createToken(user._id.toString())
    res.status(200).json({
        message:"User created!!",
        token
    })

  } catch (error) {
    next(error)
  }

}
export const login = async (req:Request , res:Response, next:NextFunction)=>{
     const {username,password} = req.body;
  try {
    const user = await User.findOne({
        username
    })
    
    if(!user) {
       res.status(409).json({
        message:"Username doesn't exists!"
       })
       return
    }
   
      
      if(user.password != password) {
        res.status(401).json({
            message:"Password mismatch!"
        })
        return
      }

    const token = createToken(user._id.toString())
    res.status(200).json({
        message:"Successfully logged in!",
        token
    })

  } catch (error) {
    next(error)
  }
}

