package com.noveltea.backend.config;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private MaturityCheckInterceptor maturityCheckInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Only runs the maturity check on book routes — everything else is untouched
        registry.addInterceptor(maturityCheckInterceptor)
                .addPathPatterns("/api/books/**");
    }
}