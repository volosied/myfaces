package org.apache.myfaces.core.integrationtests;

import jakarta.inject.Named;

import jakarta.enterprise.context.SessionScoped;

@SessionScoped
@Named("bean")
public class Bean implements java.io.Serializable {
    
    private Integer arraySize = 0;

    public Integer[] getCount() {
        if(arraySize == 1){
                return new Integer[]{1};
        } 
         return new Integer[]{};
    }

    public void setToOne(){
        System.out.println("SET TO 1");
        this.arraySize = 1;
    }

    public void resetToZero(){
        System.out.println("RESET");
        this.arraySize = 0;
    }

}
