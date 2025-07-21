import jwt from "jsonwebtoken"
export const createToken = (id:String)=>{
    try {
      const token =  jwt.sign(id,process.env.JWT_SECRET!)
      return token

    } catch (error:any) {
        throw new Error(error)
    }
}