namespace OneWeb.Application.Features.Services.DTOs;

public record ServiceDto(
    long Id, 
    string Name, 
    string? Slug,
    long? ParentId, 
    int Level,
    string? ServiceIcon, 
    string? BannerImage,
    double InitialPrice, 
    bool IsTrending,
    bool Status,
    string? HeroTitle = null,
    string? HeroSubtitle = null,
    List<ServiceDto>? Children = null
);
public record ServiceAdminDto(
    long Id, 
    string Name, 
    string? Slug,
    long? ParentId, 
    int Level,
    string? ServiceIcon, 
    string? BannerImage,
    double InitialPrice, 
    bool IsTrending,
    bool Status,
        List<ServicePriceAdminDto> Prices,
    List<ServiceAdminDto>? Children = null
);

public record ServiceDetailDto(
    long Id, 
    string Name, 
    string? Slug,
    string? About, 
    string? ServiceQuality,
    string? MetaTitle, 
    string? MetaKeywords, 
    string? MetaDescription,
    List<ServicePriceDto> Prices,
    List<ServiceScheduleDto> Schedules
);
public record ServiceDetailOutDto
 {
   public long Id {get;set;}
   public string Name {get;set;}
   public string? Slug {get;set;}
   public string? About {get;set;}
   public object? CMS {get;set;}

    public string? BannerImage { get; set; }

   public string? ServiceQuality {get;set;}
   public string? MetaTitle {get;set;}
   public string? MetaKeywords {get;set;}
   public string? MetaDescription {get;set;}
   public List<ServicePriceDto> Prices {get;set;}
  // public List<ServiceScheduleDto> Schedules { get; set; }
}

public record ServicePriceDto(long Id, string? Name, double Price);
public record ServicePriceAdminDto(long Id, string? Name, double Price, bool Status);
public record ServiceScheduleDto(long Id, string? Day, string? StartTime, string? EndTime);
