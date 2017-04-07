package com.example.foreverest.helloandroid;

import android.support.v7.app.AppCompatActivity;
/*
//import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
*/

import android.os.Bundle;
//import android.os.Bundle;

public class MainActivity extends AppCompatActivity {

    /*
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }*/

    //@Override protected void onCreate(Bundle savedInstanceState) { }

    void anotherMethod() {
        var str = "@Override protected void onCreate(Bundle savedInstanceState) { }";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }
}